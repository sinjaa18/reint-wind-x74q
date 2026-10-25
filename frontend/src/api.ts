import type { AnalysisResponse, MetaResponse } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error(`Unable to reach backend API at ${API_BASE}. Ensure FastAPI server is running on port 8000.`);
  }

  if (!response.ok) {
    let detail = `API request failed with HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Body is not JSON
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function fetchMetadata(signal?: AbortSignal): Promise<MetaResponse> {
  return requestJson<MetaResponse>('/api/meta', signal);
}

export async function fetchAnalysis(cutoff: string, signal?: AbortSignal): Promise<AnalysisResponse> {
  return requestJson<AnalysisResponse>(`/api/analysis?cutoff=${encodeURIComponent(cutoff)}`, signal);
}
