const DEFAULT_API_BASE_URL = "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 25_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return (configuredUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

async function fetchWithTimeout(
  path: string,
  init: RequestInit,
  isBlob = false,
): Promise<unknown | Blob> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `The service returned status ${response.status}.`;
      try {
        const body = await response.json();
        if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
          detail = body.detail;
        }
      } catch {
        // ignore
      }
      throw new ApiError(detail, response.status);
    }

    if (isBlob) {
      return await response.blob();
    }
    return await response.json().catch(() => null);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request took too long. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new ApiError("CampusAI could not reach the backend. Check the connection and try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  return fetchWithTimeout(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  }, false);
}

export async function requestBlob(path: string, init: RequestInit): Promise<Blob> {
  return fetchWithTimeout(path, init, true) as Promise<Blob>;
}