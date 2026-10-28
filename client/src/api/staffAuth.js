const TOKEN_KEY =
  "zenoraStaffToken";

const FALLBACK_API_URL =
  import.meta.env.DEV
    ? "http://localhost:4000"
    : "https://zenora-spa-api-git-bea-supabase-migration-biyaaxs-projects.vercel.app";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  FALLBACK_API_URL
).replace(/\/$/, "");

async function readResponse(
  response
) {
  let data;

  try {
    data =
      await response.json();
  } catch {
    data = {
      success: false,
      message:
        "The server returned an invalid response.",
    };
  }

  if (
    !response.ok ||
    !data || data.success === false
  ) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export async function staffLogin(
  email,
  password
) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (cause) {
    throw new Error("Cannot reach the server. Please check your connection.", { cause });
  }

  const data =
    await readResponse(
      response
    );

  if (
    !data.token ||
    !data.user
  ) {
    throw new Error(
      "Invalid authentication response."
    );
  }

  return data;
}

export async function staffRequest(
  path,
  token,
  options = {}
) {
  const method =
    options.method || "GET";

  const headers = {
    Authorization:
      `Bearer ${
        token ||
        sessionStorage.getItem(
          TOKEN_KEY
        ) ||
        ""
      }`,

    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    ...(options.headers || {}),
  };

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        method,
        headers,
      }
    );

  return readResponse(
    response
  );
}