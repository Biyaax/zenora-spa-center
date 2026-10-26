const TOKEN_KEY = "zenora_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token
    ? localStorage.setItem(TOKEN_KEY, token)
    : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Small fetch wrapper: sends the login token, parses JSON,
 * and throws ApiError with the server's message on failure.
 */
export async function api(path, { method = "GET", body, query } = {}) {
  const url = new URL(`/api${path}`, window.location.origin);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers = {};
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check your connection.",
      0
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Session expired: let the app know so it can log out.
      window.dispatchEvent(new Event("zenora:unauthorized"));
    }

    throw new ApiError(
      data?.message || "Something went wrong. Please try again.",
      response.status,
      data?.details
    );
  }

  return data;
}
