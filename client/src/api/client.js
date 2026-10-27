const TOKEN_KEY = "zenora_token";

const FALLBACK_API_BASE =
  "https://zenora-spa-api-git-bea-supabase-migration-biyaaxs-projects.vercel.app";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  FALLBACK_API_BASE
).replace(/\/$/, "");

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function api(
  path,
  {
    method = "GET",
    body,
    query,
  } = {}
) {
  const url = new URL(
    `${API_BASE}/api${path}`
  );

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }
  }

  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] =
      "application/json";
  }

  let response;

  try {
    response = await fetch(
      url.toString(),
      {
        method,
        headers,
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    );
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
    // Response was not JSON.
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      token
    ) {
      window.dispatchEvent(
        new Event(
          "zenora:unauthorized"
        )
      );
    }

    throw new ApiError(
      data?.message ||
        data?.error ||
        "Something went wrong. Please try again.",
      response.status,
      data?.details
    );
  }

  return data;
}