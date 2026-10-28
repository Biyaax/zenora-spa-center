# Gmail code verification before account creation

Apply this incremental patch after the validation-only correction and Gmail-only
registration patch. Keep your merged member update and current feature branch.

## Behavior

1. Enter a Gmail address and click Send Verification Code.
2. The server sends an eight-digit code to that inbox. No users/clients record is
   created by requesting a code, receiving it or verifying it.
3. Enter the code and click Verify Code. The server returns a short-lived,
   email-bound proof, not a login token. Create Account becomes available.
4. Complete valid registration details and click Create Account. The server
   requires and atomically consumes that proof before inserting a user/client.
   The new account is already email-verified; the UI returns to sign-in.

The old "Account created, check your email" registration screen is removed from
new registration. Existing legacy verification links/endpoints still work for
accounts saved by older versions; those older pending rows are not deleted.
A duplicate old pending account may require its existing verification link or
administrator assistance. Test new registration using an inbox/address you own
that is not already registered (Gmail +aliases also work).

Gmail format restriction alone is not mailbox proof. The delivered code is the
proof. There is no longer a redundant DNS check blocking a Gmail whose code was
already verified.

## Safeguards

- Cryptographically random eight-digit codes, ten-minute expiry, keyed hashes at
  rest, five incorrect attempts per challenge, one-minute resend cooldown.
- New codes invalidate old codes and old proofs. Verification codes are single-use.
- Verified proofs expire in five minutes and are bound to the exact normalized
  Gmail address. Editing email clears local verification; a proof from another
  email cannot create an account even through a direct API request.
- Proof consumption and user/client insertion happen in one transaction; form
  errors do not create accounts. Concurrent attempts can create at most one account.
- No code/password is returned through an API or logged as an email body.
- Failed SMTP delivery returns an error and never claims "sent" or creates an account.
- IP throttles: five sends / 15 minutes, twenty verification attempts / 15 minutes.
  Counters are per process; attempt and resend limits are stored persistently.
- Existing live form validation, password eye toggles, member login redirect,
  appointment rules and Gmail-only policy remain. Forgot Password is still deferred.

## Required temporary storage

Codes need persistent expiry/attempt/proof data across backend requests. This
patch adds ONE temporary-code table, independent of users/clients. It does not
alter existing user columns, require session-version fields, create pending
accounts, or change your DATABASE_URL.

After applying the patch:

```powershell
npm --prefix .\server ci
npm --prefix .\server run db:registration-codes
npm --prefix .\server test
npm --prefix .\client test
npm --prefix .\client run build
```

The table setup command runs only
`server/database/migrations/registration-codes.sql`, which is additive/idempotent.
Do NOT run the full seed/setup script. If the existing database connection times
out, this command has not succeeded; stop and do not claim the live flow is ready.
The SQL file can alternatively be run by your database owner in the correct
project's SQL editor. Normal backend database connectivity is still required.

Actual email delivery also needs the existing SMTP settings in server/.env (see
README-REGISTRATION.md). Without working SMTP, sending fails safely and no account
is created. No SMTP credentials are bundled. Do not share .env screenshots.

Restart both development servers after applying. Client `.env` VITE_API_URL must
point to the updated API, for example http://localhost:4000 for local testing.
Using an older deployed backend will not provide the code endpoints. Deploy the
updated backend and create its code table before deploying the new frontend.

## Validation

44 automated tests pass (34 server, 10 client). New registration tests use an
isolated PostgreSQL/PGlite database to verify zero accounts before proof, missing/
forged/expired/email-mismatched proof rejection, code attempt limits, resend,
SMTP failure, hashing, transaction consumption and concurrent creation behavior.
The production build and AuthModal lint check pass. Browser checks with sample
responses cover delivery failure, wrong code, disabled Create Account before
verification, email-change invalidation, proof payload, account creation only on
final submit, verified success and return to sign-in. Real SMTP/inbox delivery and
your live database have not been tested with credentials here.
