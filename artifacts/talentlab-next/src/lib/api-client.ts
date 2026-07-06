"use client";

const DEFAULT_API_URL = "http://localhost:5000/api/v1";

export class ApiError extends Error {
  status: number;
  error?: string;

  constructor(message: string, status: number, error?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.error = error;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  const url = `${baseUrl}/${endpoint.replace(/^\//, "")}`;

  // Get token on client side
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("rms_token");
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // If it's a 401 Unauthorized, we can log the user out
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("rms_token");
      localStorage.removeItem("rms_user");
      // Trigger a redirect if we are on the client
      window.dispatchEvent(new Event("auth-unauthorized"));
    }

    const message = data?.error || data?.message || "An unexpected API error occurred";
    throw new ApiError(message, response.status, data?.error);
  }

  // Handle standard envelopes: e.g. { success: true, data: ... }
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    const payload = data.data;
    if (payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)) {
      const array = [...payload.data];
      Object.defineProperties(array, {
        total: { value: payload.total, enumerable: false },
        limit: { value: payload.limit, enumerable: false },
        offset: { value: payload.offset, enumerable: false },
        cursor: { value: payload.cursor, enumerable: false },
      });
      return array as unknown as T;
    }
    return payload as T;
  }

  if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
    const array = [...data.data];
    Object.defineProperties(array, {
      total: { value: data.total, enumerable: false },
      limit: { value: data.limit, enumerable: false },
      offset: { value: data.offset, enumerable: false },
      cursor: { value: data.cursor, enumerable: false },
    });
    return array as unknown as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
