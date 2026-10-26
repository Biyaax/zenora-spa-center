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

  if (!Number.isInteger(number) || number <= 0) {
    throw badRequest(`${label} is invalid.`);
  }

  return number;
}

function optionalId(value, label) {
  if (value === undefined || value === null || value === "") return null;
  return id(value, label);
}

module.exports = { text, email, phone, id, optionalId };
