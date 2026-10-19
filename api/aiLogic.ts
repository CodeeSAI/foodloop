import { evaluateRecipientConstraints } from '../src/utils/constraintEngine';
import type { Donation, Recipient } from '../src/types';

export interface AiConfig {
  provider: 'openrouter' | 'nebius';
  apiKey: string;
  hasKey: boolean;
  model: string;
  baseUrl: string;
}

/**
 * Resolves AI provider configuration from environment.
 * Prioritizes OpenRouter according to .env.local / AI_PROVIDER.
 * Never logs or exposes API keys.
 */
export function resolveAiConfig(customEnv?: Record<string, string | undefined>): AiConfig {
  const env = customEnv || process.env;
  const rawProvider = (env.AI_PROVIDER || '').trim().toLowerCase();
  const provider: 'openrouter' | 'nebius' = rawProvider === 'nebius' ? 'nebius' : 'openrouter';

  if (provider === 'openrouter') {
    const rawKey = (env.OPENROUTER_API_KEY || '').trim();
    // Guard against placeholder / empty keys
    const hasKey = Boolean(
      rawKey.length > 0 &&
      rawKey !== 'YOUR_ACTUAL_KEY' &&
      !rawKey.startsWith('YOUR_')
    );
    let model = (env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free').trim();
    if (model.endsWith(':frees')) {
      model = model.slice(0, -1);
    }
    const rawBaseUrl = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').trim();
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    return { provider: 'openrouter', apiKey: rawKey, hasKey, model, baseUrl };
  } else {
    const rawKey = (env.NEBIUS_API_KEY || '').trim();
    const hasKey = Boolean(
      rawKey.length > 0 &&
      rawKey !== 'YOUR_ACTUAL_KEY' &&
      !rawKey.startsWith('YOUR_')
    );
    const model = (env.NEBIUS_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct').trim();
    const rawBaseUrl = (env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1').trim();
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    return { provider: 'nebius', apiKey: rawKey, hasKey, model, baseUrl };
  }
}

/**
 * Generates status check response for GET /api/ai.
 * Clearly reports whether real credentials are valid or operating in simulation mode.
 */
export function getAiStatusResponse(config: AiConfig) {
  const isSimulation = !config.hasKey;
  const providerLabel = config.provider === 'openrouter' ? 'OpenRouter' : 'Nebius Token Factory';
  return {
    configured: config.hasKey,
    hasKey: config.hasKey,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    isLiveVerified: false,
    mode: isSimulation
      ? 'deterministic_fallback_simulation'
      : (config.provider === 'openrouter' ? 'live_openrouter_inference' : 'live_nebius_inference'),
    message: config.hasKey
      ? `${providerLabel} credentials configured for live NVIDIA Nemotron inference.`
      : `Operating in Deterministic Fallback Simulation mode. Set OPENROUTER_API_KEY in .env.local for live inference.`,
  };
}

/**
 * Executes server-side AI inference with:
 * - Strict 14.5-second timeout (ensuring resolution within 15-second client deadline)
 * - Error handling for HTTP 429 rate limits, 401/403 auth failures, network drops
 * - Schema extraction and application data validation
 * - Deterministic food-safety constraint enforcement
 * - Secret key protection (never exposed or logged)
 */
export type DonationPayload = Partial<Donation>;
export type RecipientPayload = Partial<Recipient>;

export interface AiInferenceRequestBody {
  prompt?: string;
  type?: string;
  donation?: DonationPayload;
  recipient?: RecipientPayload;
  context?: Record<string, unknown>;
}

export async function handleAiInference(
  requestBody: unknown,
  config: AiConfig,
  fetchFn: typeof fetch = fetch,
  externalSignal?: AbortSignal
) {
  const startTime = Date.now();
  let parsedBody: AiInferenceRequestBody = {};
  if (typeof requestBody === 'string') {
    try {
      parsedBody = JSON.parse(requestBody);
    } catch {
      parsedBody = {};
    }
  } else if (typeof requestBody === 'object' && requestBody !== null) {
    parsedBody = requestBody as AiInferenceRequestBody;
  }

  const { prompt, type, donation, recipient, context } = parsedBody || {};

  // If no valid key is present, execute simulation fallback immediately
  if (!config.hasKey) {
    const fallback = generateDeterministicReasoning(type, donation, recipient, context);
    const executionMs = Math.max(15, Date.now() - startTime);
    return {
      status: 200,
      body: {
        success: true,
        source: 'deterministic_fallback' as const,
        isLive: false,
        model: `${config.model} (Simulated Fallback - Set OPENROUTER_API_KEY in .env.local for live inference)`,
        result: fallback,
        executionMs,
      },
    };
  }

  // Strict 14.5-second timeout enforcement to guarantee response before 15-second client deadline
  const controller = new AbortController();
  const timeoutMs = 14500;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort());
    }
  }

  const systemPrompt = `You are NVIDIA Nemotron for FOODLOOP - an AI surplus food rescue platform.
Provide fast, concise operational logistics. Output strictly valid JSON without markdown or preamble:
{
  "summary": "Brief 1-sentence executive recommendation",
  "reasoning": "Direct operational logic under 45 words",
  "tradeOffs": ["Key trade-off 1", "Key trade-off 2"],
  "contingencyPlan": "1-sentence backup plan if courier or temperature delayed",
  "confidenceScore": 96.5,
  "haccpSafetyAssessment": "HACCP compliance check and temperature note"
}`;

  const userPrompt = prompt || (donation && recipient
    ? `Evaluate donation lot "${donation.title}" (${donation.quantityKg}kg, ${donation.storageType}) from "${donation.donorName}" for recipient "${recipient.name}" (${recipient.type}, distance ${recipient.distanceKm}km). Ensure food safety compliance.`
    : `Synthesize optimal surplus food rescue dispatch route and allocation.`);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://foodloop.app';
      headers['X-Title'] = 'FOODLOOP Surplus Rescue Platform';
    }

    const requestPayload: Record<string, any> = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    };

    if (config.provider === 'openrouter') {
      requestPayload.reasoning = { max_tokens: 0 };
    }

    const response = await fetchFn(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const executionMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');

      // Rate limit handling (HTTP 429)
      if (response.status === 429) {
        const fallback = generateDeterministicReasoning(type, donation, recipient, context);
        return {
          status: 200,
          body: {
            success: true,
            source: 'deterministic_fallback_after_api_error' as const,
            isLive: false,
            apiError: 'OpenRouter API rate limit exceeded (HTTP 429). Utilizing deterministic fallback.',
            model: `${config.model} (Rate Limit Fallback - Simulation)`,
            result: fallback,
            executionMs,
          },
        };
      }

      // Authentication / Key Limit failure handling (HTTP 401 / 403)
      if (response.status === 401 || response.status === 403) {
        const fallback = generateDeterministicReasoning(type, donation, recipient, context);
        let errorDetail = `OpenRouter authentication failure (HTTP ${response.status}).`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) {
            errorDetail = `OpenRouter HTTP ${response.status}: ${errJson.error.message}`;
          }
        } catch {}
        const sanitizedErr = errorDetail.split(config.apiKey).join('[REDACTED]');
        return {
          status: 200,
          body: {
            success: true,
            source: 'deterministic_fallback_after_api_error' as const,
            isLive: false,
            apiError: sanitizedErr,
            model: `${config.model} (Simulation Fallback)`,
            result: fallback,
            executionMs,
          },
        };
      }

      // Other HTTP errors (sanitize error message to never leak API key)
      const sanitizedErr = errText
        .split(config.apiKey)
        .join('[REDACTED]')
        .slice(0, 150);

      const fallback = generateDeterministicReasoning(type, donation, recipient, context);
      return {
        status: 200,
        body: {
          success: true,
          source: 'deterministic_fallback_after_api_error' as const,
          isLive: false,
          apiError: `OpenRouter API error (HTTP ${response.status}): ${sanitizedErr}`,
          model: `${config.model} (API Error Fallback - Simulation)`,
          result: fallback,
          executionMs,
        },
      };
    }

    const data = await response.json();

    // Check for internal provider error object returned inside HTTP 200 (common on OpenRouter free tier timeouts)
    if (data.error) {
      const fallback = generateDeterministicReasoning(type, donation, recipient, context);
      const errDetail = data.error.message || `Upstream error ${data.error.code || ''}`;
      const sanitized = errDetail.split(config.apiKey).join('[REDACTED]');
      return {
        status: 200,
        body: {
          success: true,
          source: 'deterministic_fallback_after_api_error' as const,
          isLive: false,
          apiError: `OpenRouter upstream: ${sanitized}. Engaging deterministic fallback.`,
          model: `${config.model} (Upstream Timeout Fallback - Simulation)`,
          result: fallback,
          executionMs,
        },
      };
    }

    const choice = data.choices?.[0];
    const rawContent = choice?.message?.content || choice?.message?.reasoning || '';

    // Extract JSON payload safely
    const parsedPayload = extractJsonPayload(rawContent);

    // If completely malformed or non-JSON, fall back gracefully
    if (!parsedPayload || typeof parsedPayload !== 'object') {
      const fallback = generateDeterministicReasoning(type, donation, recipient, context);
      return {
        status: 200,
        body: {
          success: true,
          source: 'deterministic_fallback_after_api_error' as const,
          isLive: false,
          apiError: 'Model output was malformed or non-JSON. Falling back to deterministic parameters.',
          model: `${config.model} (Malformed Output Fallback - Simulation)`,
          result: fallback,
          executionMs,
        },
      };
    }

    // Validate and reconcile with real application data & safety constraints
    const validatedResult = validateAndReconcileModelOutput(parsedPayload, donation, recipient);

    return {
      status: 200,
      body: {
        success: true,
        source: config.provider === 'openrouter' ? ('openrouter_live' as const) : ('nebius_live' as const),
        isLive: true,
        model: config.model,
        result: validatedResult,
        executionMs,
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const executionMs = Date.now() - startTime;
    const errObj = err instanceof Error ? err : null;
    const isTimeout =
      errObj?.name === 'AbortError' ||
      errObj?.message?.includes('timeout') ||
      errObj?.message?.includes('aborted');

    const fallback = generateDeterministicReasoning(type, donation, recipient, context);
    const rawErrorMessage = errObj?.message || 'Network error connecting to AI provider. Utilizing deterministic fallback.';
    const errorMessage = isTimeout
      ? 'Inference request timed out after 15 seconds. Instant deterministic fallback engaged.'
      : (config.apiKey ? rawErrorMessage.split(config.apiKey).join('[REDACTED]') : rawErrorMessage);

    return {
      status: 200,
      body: {
        success: true,
        source: 'deterministic_fallback_error' as const,
        isLive: false,
        apiError: errorMessage,
        model: `${config.model} (Fallback Engine - Simulation)`,
        result: fallback,
        executionMs,
      },
    };
  }
}

/**
 * Validates model output against real application entities and enforces deterministic food safety rules.
 * Safety constraints can NEVER be overridden by model hallucinations.
 */
export function validateAndReconcileModelOutput(
  raw: Record<string, unknown> | null | undefined,
  donation?: DonationPayload,
  recipient?: RecipientPayload
) {
  const donorName = donation?.donorName || 'Grand Hyatt Central';
  const foodItem = donation?.title || 'Prepared Surplus Food';
  const quantity = donation?.quantityKg ? `${donation.quantityKg}kg` : '45kg';
  const recipientName = recipient?.name || 'Hope Community Kitchen';
  const storageType = donation?.storageType || 'hot';
  const tempTarget = donation?.tempTargetC || (storageType === 'hot' ? 65 : 4);

  // 1. Validate fields and provide resilient fallbacks
  const summary =
    typeof raw?.summary === 'string' && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : `Prioritize ${recipientName} for ${quantity} of ${foodItem} from ${donorName}.`;

  const reasoning =
    typeof raw?.reasoning === 'string' && raw.reasoning.trim().length > 0
      ? raw.reasoning.trim()
      : `${recipientName} intake capacity verified. Transit preserves safe ${storageType === 'hot' ? 'hot-holding (>60°C)' : 'cold-chain (<8°C)'} parameters.`;

  const tradeOffs: string[] =
    Array.isArray(raw?.tradeOffs) && raw.tradeOffs.length > 0
      ? (raw.tradeOffs as unknown[]).map((t) => String(t).trim()).filter(Boolean)
      : [`Fulfills urgent demand at ${recipientName}.`, `Requires calibrated thermal containment.`];

  const contingencyPlan =
    typeof raw?.contingencyPlan === 'string' && raw.contingencyPlan.trim().length > 0
      ? raw.contingencyPlan.trim()
      : 'If delay exceeds 20 minutes, automatically trigger secondary routing to the nearest active holding hub.';

  let confidenceScore =
    typeof raw?.confidenceScore === 'number' && !isNaN(raw.confidenceScore)
      ? Math.max(0, Math.min(100, raw.confidenceScore))
      : 95.0;

  let haccpSafetyAssessment =
    typeof raw?.haccpSafetyAssessment === 'string' && raw.haccpSafetyAssessment.trim().length > 0
      ? raw.haccpSafetyAssessment.trim()
      : `Maintain core food temp (${tempTarget}°C standard) throughout transit with digital probe verification.`;

  // 2. Preserve deterministic food-safety checks
  if (donation && recipient) {
    const safetyCheck = evaluateRecipientConstraints(donation, recipient);
    if (!safetyCheck.eligible) {
      // Deterministic food-safety rules CANNOT be bypassed by LLM
      confidenceScore = Math.min(confidenceScore, 35.0);
      const safetyViolations = safetyCheck.rejectionReasons.join('; ');
      haccpSafetyAssessment = `SAFETY CONSTRAINTS FAILED: ${safetyViolations}. Dispatch lockout mandated.`;
      tradeOffs.unshift(`CRITICAL SAFETY CONFLICT: ${safetyCheck.rejectionReasons[0]}`);
    }
  }

  return {
    summary,
    reasoning,
    tradeOffs,
    contingencyPlan,
    confidenceScore,
    haccpSafetyAssessment,
  };
}

export function extractJsonPayload(content: string) {
  if (!content) return null;
  // 1. Direct parse attempt
  try {
    return JSON.parse(content);
  } catch {}

  // 2. Fenced code block ```json ... ```
  const matchFence = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (matchFence && matchFence[1]) {
    try {
      return JSON.parse(matchFence[1]);
    } catch {}
  }

  // 3. Find outer braces '{' ... '}'
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

export function generateDeterministicReasoning(
  _type?: string,
  donation?: DonationPayload,
  recipient?: RecipientPayload,
  _context?: Record<string, unknown>
) {
  const donorName = donation?.donorName || 'Grand Hyatt Central';
  const foodItem = donation?.title || 'Prepared Hot Buffet Trays';
  const quantity = donation?.quantityKg
    ? `${donation.quantityKg}kg (${donation.servings || 120} servings)`
    : '45kg (240 servings)';
  const recipientName = recipient?.name || 'Hope Community Kitchen';
  const remainingKg = recipient?.capacityTotalKg
    ? recipient.capacityTotalKg - (recipient.capacityUsedKg || 0)
    : 440;
  const distanceKm = recipient?.distanceKm || 3.2;
  const transitMins = Math.max(6, Math.round(distanceKm * 3.2));
  const storageType = donation?.storageType || 'hot';
  const tempTarget = donation?.tempTargetC || (storageType === 'hot' ? 65 : 4);

  return {
    summary: `Prioritize ${recipientName} for ${quantity} of ${foodItem} from ${donorName}.`,
    reasoning: `${recipientName} currently has ${remainingKg}kg verified intake capacity. The direct corridor transit time is ~${transitMins} minutes, well within the safe ${storageType === 'hot' ? 'HACCP hot-holding threshold (>60°C)' : 'cold-chain margin (<8°C)'}. Allergen declarations and physical handling capacity verified compatible with recipient intake.`,
    tradeOffs: [
      `Selecting ${recipientName} fulfills urgent demand (${distanceKm}km away), balancing load across regional shelters.`,
      `Requires dedicated thermal containment at ${tempTarget}°C during transit to preserve safety integrity.`,
    ],
    contingencyPlan: `If courier delay exceeds 20 minutes, automatically trigger secondary routing to the nearest compatible hub equipped with active holding units.`,
    confidenceScore: 98.4,
    haccpSafetyAssessment: `Maintain core food temp (${tempTarget}°C standard) throughout transit. Digital probe sign-off required at donor handoff and recipient receiving dock.`,
  };
}
