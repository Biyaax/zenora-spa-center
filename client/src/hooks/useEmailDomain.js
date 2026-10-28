import { useEffect, useState } from "react";
import { api } from "../api/client";
import { registrationEmailError } from "../utils/registrationValidation";

export function useEmailDomain(email, enabled) {
  const normalized = email.trim().toLowerCase();
  const eligible = enabled && !registrationEmailError(email);
  const [result, setResult] = useState({ email: "", status: "idle", message: "" });
  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      setResult({ email: normalized, status: "checking", message: "Checking email domain..." });
      try {
        const data = await api("/auth/email-domain", { method: "POST", body: { email: normalized }, signal: controller.signal });
        if (active) setResult({ email: normalized, status: "valid", message: data.message });
      } catch (error) {
        if (active) setResult({ email: normalized, status: error.status === 400 ? "invalid" : "unavailable", message: error.status === 400 ? error.message : "Could not check the domain right now. We will check again when you submit." });
      }
    }, 600);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [normalized, eligible]);
  if (!eligible) return { status: "idle", message: "" };
  return result.email === normalized ? result : { status: "waiting", message: "Checking email domain shortly..." };
}
