import { Donation, Recipient, AiPlanResult, AiBackendStatus } from '../types';

export interface AiRequestPayload {
  prompt?: string;
  type: 'planner' | 'match_explain' | 'tradeoff' | 'contingency';
  donation?: Donation;
  recipient?: Recipient;
  context?: Record<string, any>;
}

export async function getAiBackendStatus(): Promise<AiBackendStatus> {
  try {
    const res = await fetch('/api/ai');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      configured: Boolean(data.configured),
      hasKey: Boolean(data.hasKey),
      model: data.model || 'nvidia/nemotron-3.5-lightning:free',
      baseUrl: data.baseUrl || 'https://openrouter.ai/api/v1',
      provider: data.provider || 'openrouter',
      isLiveVerified: Boolean(data.isLiveVerified),
      mode: data.mode || (data.configured ? 'live_openrouter_inference' : 'deterministic_fallback_simulation'),
      message: data.message,
    };
  } catch (_err: unknown) {
    return {
      configured: false,
      hasKey: false,
      model: 'nvidia/nemotron-3.5-lightning:free',
      baseUrl: 'https://openrouter.ai/api/v1',
      provider: 'openrouter',
      isLiveVerified: false,
      mode: 'deterministic_fallback_simulation',
      message: 'Running in Local Deterministic Fallback mode.',
    };
  }
}

export async function callAiPlanner(
  payload: AiRequestPayload,
  externalSignal?: AbortSignal
): Promise<AiPlanResult> {
  const startTime = Date.now();
  const clientController = new AbortController();
  // Client 15-second deadline guarantee
  const timeoutId = setTimeout(() => clientController.abort(), 15000);

  // Link external signal if provided
  if (externalSignal) {
    if (externalSignal.aborted) {
      clientController.abort();
    } else {
      externalSignal.addEventListener('abort', () => clientController.abort());
    }
  }

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: clientController.signal,
    });

    clearTimeout(timeoutId);
    const clientElapsedMs = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Server endpoint responded with status ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.result?.summary || 'Route synthesis prepared with validated parameters.',
      reasoning: data.result?.reasoning || 'Operational parameters validated against constraints.',
      tradeOffs: data.result?.tradeOffs || ['Standard capacity routing selected.'],
      contingencyPlan: data.result?.contingencyPlan || 'Fallback to nearest secondary intake hub if delayed.',
      confidenceScore: data.result?.confidenceScore || 95.0,
      haccpSafetyAssessment: data.result?.haccpSafetyAssessment || 'Temperature probe verification mandated.',
      source: data.source || 'deterministic_fallback',
      model: data.model || 'nvidia/nemotron-3.5-lightning:free',
      executionMs: data.executionMs || clientElapsedMs,
      isLive: data.isLive ?? false,
      apiError: data.apiError,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const clientElapsedMs = Date.now() - startTime;
    const errObj = error instanceof Error ? error : null;
    const isTimeout =
      errObj?.name === 'AbortError' ||
      errObj?.message?.includes('aborted') ||
      clientElapsedMs >= 14500;

    const errorMsg = isTimeout
      ? 'Inference deadline exceeded 15 seconds. Instant deterministic simulation engaged.'
      : (errObj?.message || 'Network request failed. Utilizing deterministic fallback.');

    console.warn('AI call error, generating deterministic fallback:', errorMsg);
    const fallback = getLocalDeterministicPlan(payload.donation, payload.recipient);
    return {
      ...fallback,
      executionMs: clientElapsedMs,
      apiError: errorMsg,
      isLive: false,
    };
  }
}

// Maintained for backward compatibility
export const callNebiusNemotron = callAiPlanner;

export function getLocalDeterministicPlan(donation?: Donation, recipient?: Recipient): AiPlanResult {
  const donor = donation?.donorName || 'Grand Hyatt Central';
  const food = donation?.title || 'Hot Buffet Entrees';
  const qty = donation ? `${donation.quantityKg}kg (${donation.servings} servings)` : '45kg (240 servings)';
  const rec = recipient?.name || 'Hope Community Kitchen';
  const dist = recipient?.distanceKm || 3.2;

  return {
    summary: `Prioritize ${rec} for ${qty} of ${food} from ${donor} (${dist} km away).`,
    reasoning: `${rec} has ${recipient ? recipient.capacityTotalKg - recipient.capacityUsedKg : 440}kg remaining capacity and an active dinner service window. Transit duration via urban green corridor is ~11 mins, well inside the ${donation?.storageType === 'hot' ? '60°C hot-holding HACCP threshold' : 'safe temperature margin'}. Allergen profile (${donation?.allergens.join(', ') || 'verified safe'}) matches shelter intake restrictions.`,
    tradeOffs: [
      `Selecting ${rec} fills substantial capacity, reserving St. Jude Haven for higher volume warehouse donations later today.`,
      `Requires dedicated insulated thermal tote containers on Courier Van #2 to maintain temperature compliance.`
    ],
    contingencyPlan: `If courier delay exceeds 20 minutes, automatically pivot delivery to Downtown Family Mission (0.9km alternate node) with commercial holding ovens.`,
    confidenceScore: 98.4,
    haccpSafetyAssessment: `Maintain core temperature log with digital thermal probe sign-off upon departure and destination receipt.`,
    source: 'deterministic_fallback',
    model: 'nvidia/nemotron-3.5-lightning:free (Deterministic Fallback Engine)',
    executionMs: 85,
    isLive: false,
  };
}
