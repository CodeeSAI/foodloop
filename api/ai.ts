// Vercel Serverless Function Handler for OpenRouter & Nebius AI inference
import {
  resolveAiConfig,
  getAiStatusResponse,
  handleAiInference,
} from './aiLogic';

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  end: () => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const config = resolveAiConfig();

  // GET /api/ai or /api/ai/status
  if (req.method === 'GET') {
    return res.status(200).json(getAiStatusResponse(config));
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const response = await handleAiInference(req.body, config);
  return res.status(response.status).json(response.body);
}
