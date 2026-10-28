const { badRequest } = require("./errors");
const NAME_RE = /^[\p{L}\p{M} .'’-]+$/u;
const LOCAL_EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_\x60{|}~-]+$/;
const DOMAIN_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

function nameError(value, label) {
  if (typeof value !== "string" || !value.trim()) return `${label} is required.`;
  const name = value.trim();
  if (name.length > 80) return `${label} must be 80 characters or fewer.`;
  if (!NAME_RE.test(name) || !/\p{L}/u.test(name)) {
    return `${label} may contain letters, spaces, apostrophes, periods and hyphens.`;
  }
  return "";
}

function registrationEmailError(value) {
  if (typeof value !== "string" || !value.trim()) return "Email is required.";
  const email = value.trim();
  const parts = email.split("@");
  if (email.length > 254 || parts.length !== 2) return "Enter a valid email address.";
  const [local, domain] = parts;
  const labels = domain.split(".");
  if (!local || local.length > 64 || !LOCAL_EMAIL_RE.test(local) ||
      local.startsWith(".") || local.endsWith(".") || local.includes("..") ||
      labels.length < 2 || labels.some((label) => !DOMAIN_LABEL_RE.test(label)) ||
      !/[a-z]/i.test(labels.at(-1)) || labels.at(-1).length < 2) {
    return "Enter a valid email address, such as name@example.com.";
  }
  if (domain.toLowerCase() !== "gmail.com") return "Please use a Gmail address ending in @gmail.com.";
  return "";
}

function normalizePhPhone(value) {
  if (typeof value !== "string") return "";
  const compact = value.trim().replace(/[ ()-]/g, "");
  if (/^\+?639\d{9}$/.test(compact)) return "0" + compact.replace(/^\+?63/, "");
  return compact;
}

function phoneError(value) {
  if (typeof value !== "string" || !value.trim()) return "Contact number is required.";
  if (value.length > 30 || !/^09\d{9}$/.test(normalizePhPhone(value))) {
    return "Enter a Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX.";
  }
  return "";
}

function passwordError(value) {
  if (typeof value !== "string" || !value.trim()) return "Password is required; spaces alone are not allowed.";
  if (Array.from(value).length < 8) return "Password must contain at least 8 characters.";
  if (new TextEncoder().encode(value).length > 72) return "Password is too long. Use fewer characters, especially emojis or accented letters.";
  if (value.includes("\0")) return "Password contains an invalid character.";
  return "";
}

function validateRegistration(data) {
  const errors = {};
  for (const [field, message] of [
    ["firstName", nameError(data.firstName, "First name")],
    ["lastName", nameError(data.lastName, "Last name")],
    ["email", registrationEmailError(data.email)],
    ["phone", phoneError(data.phone)],
    ["password", passwordError(data.password)],
  ]) if (message) errors[field] = message;
  if (typeof data.confirmPassword !== "string" || !data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

function registrationFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Please send a valid registration form.");
  }
  const fields = validateRegistration(body);
  if (Object.keys(fields).length) {
    throw badRequest("Please correct the highlighted fields.", { fields });
  }
  return {
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: normalizePhPhone(body.phone),
    password: body.password,
  };
}
module.exports = { registrationFields, registrationEmailError };
