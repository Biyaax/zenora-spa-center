const crypto = require("crypto");
const config = require("../config");

// Minimal HS256 JSON Web Token implementation (no extra dependency).

const encode = (value) => Buffer.from(value).toString("base64url");

function signature(data) {
  return crypto
    .createHmac("sha256", config.jwtSecret)
    .update(data)
    .digest("base64url");
}

function sign(payload) {
  const now = Math.floor(Date.now() / 1000);

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + config.jwtExpiresHours * 3600,
    })
  );

  return `${header}.${body}.${signature(`${header}.${body}`)}`;
}

/** Returns the payload, or null if the token is invalid or expired. */
function verify(token) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, given] = parts;
  const expected = signature(`${header}.${body}`);

  const givenBuffer = Buffer.from(given);
  const expectedBuffer = Buffer.from(expected);

  if (
    givenBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(givenBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
