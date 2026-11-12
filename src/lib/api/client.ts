type RequestOptions = {
  headers?: Record<string, string>
  cache?: RequestCache
  next?: { revalidate?: number; tags?: string[] }
}

type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  status: number
}

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
}

async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit & RequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      throw new ApiError(
        data.error || `Request failed with status ${res.status}`,
        res.status
      )
    }

    return { data: data as T, status: res.status }
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status }
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred",
      status: 500,
    }
  }
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    apiFetch<T>(url, { method: "GET", ...options }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    apiFetch<T>(url, { method: "DELETE", ...options }),
}

export { apiFetch, ApiError }
export type { ApiResponse, RequestOptions }
