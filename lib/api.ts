const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  data: T
  message?: string
}

export interface PaginatedData<T = unknown> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token")
      localStorage.removeItem("jwt_user")
      window.location.href = "/signin"
    }
    throw new Error("Unauthorized")
  }

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || `Request failed with status ${res.status}`)
  }

  return json as ApiResponse<T>
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: "POST",
      body: formData,
    }),
}
