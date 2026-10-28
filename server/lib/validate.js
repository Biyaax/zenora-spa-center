const { badRequest } = require("./errors");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s.]{7,20}$/;

function text(value, label, { required = true, max = 255 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${label} is required.`);
    return null;
  }

  if (typeof value !== "string") {
    throw badRequest(`${label} must be text.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    if (required) throw badRequest(`${label} is required.`);
    return null;
  }

  if (trimmed.includes("\0")) {
    throw badRequest(`${label} contains an invalid character.`);
  }

  if (trimmed.length > max) {
    throw badRequest(`${label} must be ${max} characters or fewer.`);
  }

  return trimmed;
}

function email(value, label = "Email", { required = true } = {}) {
  const trimmed = text(value, label, { required, max: 254 });
  if (trimmed === null) return null;

  if (!EMAIL_RE.test(trimmed)) {
    throw badRequest(`${label} is not a valid email address.`);
  }

  return trimmed.toLowerCase();
}

function phone(value, label = "Phone", { required = false } = {}) {
  const trimmed = text(value, label, { required, max: 20 });
  if (trimmed === null) return null;

  if (!PHONE_RE.test(trimmed)) {
    throw badRequest(`${label} is not a valid phone number.`);
  }

  return trimmed;
}

function id(value, label) {
  const number = Number(value);

  if (
    !(typeof value === "number" || (typeof value === "string" && /^[1-9]\d*$/.test(value))) ||
    !Number.isSafeInteger(number) || number <= 0 || number > 2147483647
  ) {
    throw badRequest(`${label} is invalid.`);
  }

  return number;
}

function optionalId(value, label) {
  if (value === undefined || value === null || value === "") return null;
  return id(value, label);
}

function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest("Please send a valid request body.");
  }
  return value;
}

function loginFields(body) {
  object(body);
  const fields = {};
  let normalizedEmail;
  try { normalizedEmail = email(body.email); }
  catch (error) { fields.email = error.message; }
  if (typeof body.password !== "string" || !body.password.trim()) {
    fields.password = "Password is required.";
  } else if (body.password.length > 4096) {
    fields.password = "Password is too long.";
  }
  if (Object.keys(fields).length) {
    throw badRequest("Please correct the highlighted fields.", { fields });
  }
  return { email: normalizedEmail, password: body.password };
}

module.exports = { text, email, phone, id, optionalId, object, loginFields };
