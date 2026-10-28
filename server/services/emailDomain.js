const { Resolver } = require("node:dns/promises");
const { HttpError, badRequest } = require("../lib/errors");

const missingRecord = (error) => ["ENODATA", "ENOTFOUND"].includes(error?.code);
const invalidDomain = () => badRequest(
  "This email domain cannot receive mail. Please check the address.",
  { fields: { email: "Please use an email address at a domain that accepts mail." } }
);
const lookupUnavailable = () => new HttpError(503,
  "We could not check your email domain right now. Please try again.",
  { fields: { email: "Email domain checking is temporarily unavailable. Please try again." } }
);

/** DNS establishes mail routing, not whether an individual mailbox exists. */
async function requireMailDomain(email, resolver = new Resolver({ timeout: 2000, tries: 1 })) {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  let records;
  try {
    records = await resolver.resolveMx(domain);
  } catch (error) {
    if (error.code === "ENOTFOUND") throw invalidDomain();
    if (!missingRecord(error)) throw lookupUnavailable();
    records = [];
  }
  if (records.length) {
    // A null MX (root exchange, '.' or '') explicitly means no mail service.
    if (records.some((record) => record.exchange && record.exchange !== ".")) return;
    throw invalidDomain();
  }
  // RFC 5321 implicit MX fallback when the domain publishes no MX records.
  const addresses = await Promise.allSettled([
    resolver.resolve4(domain), resolver.resolve6(domain),
  ]);
  if (addresses.some((result) => result.status === "fulfilled" && result.value.length)) return;
  if (addresses.some((result) => result.status === "rejected" && !missingRecord(result.reason))) {
    throw lookupUnavailable();
  }
  throw invalidDomain();
}

module.exports = { requireMailDomain };
