
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function staffLogin(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Login failed.");
  }

  if (!data.token || !data.user) {
    throw new Error("Invalid authentication response.");
  }

  return data;
}

export async function staffRequest(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
