# Guest registration and login validation

Apply this patch AFTER the revised appointment/staff-login validation patch
against main c3083a6. Keep both updates on your existing validation branch.
This is an incremental patch, not a replacement for the prior patch.

## Apply

Save `zenora-registration-validation.patch` in Downloads. From the project root:

```powershell
git branch --show-current
$patch = Join-Path $env:USERPROFILE "Downloads\zenora-registration-validation.patch"
git apply --check "$patch"
if ($LASTEXITCODE -eq 0) {
    git apply "$patch"
}
```

The expected branch is `feature/appointment-staff-validation`. A successful check
normally prints nothing. If the check reports errors, stop and keep the existing
files; do not use reset, force or folder replacement. This patch works with the
previous validation edits still uncommitted. It neither commits nor pushes.

Run the checks, then restart your client and server development processes:

```powershell
npm --prefix .\server test
npm --prefix .\client test
npm --prefix .\client run build
```

No new dependencies or database migrations are required for this incremental
patch. Deploy the client and server together: registration now sends and validates
`confirmPassword` on the API as well as in the browser.

## What changed

All six guest-registration fields now have errors beside the relevant input,
invalid-field borders, blur/submission feedback, focus on the first invalid field,
and server-field errors displayed in place. Values remain after rejection.

- First/last name: required, maximum 80 characters, letters including accents and
  combining marks, spaces, apostrophes, periods and hyphens. One-letter names are
  allowed. Digits, HTML, control characters and punctuation-only names are rejected.
- Email: required, practical address structure/length checks, valid domain labels,
  valid local-part boundaries, plus aliases allowed, and duplicate-address errors.
  This form targets conventional ASCII email addresses, including punycode domains;
  internationalized local-parts and quoted local-parts are not supported.
- Phone: Philippine mobile formats `09XXXXXXXXX`, `+639XXXXXXXXX`, and `639XXXXXXXXX`
  are accepted, with spaces/hyphens/parentheses permitted for formatting. Saved
  numbers normalize to 11-digit `09...`. Other countries and landlines are outside
  this form's intended input. The check validates format, not phone ownership.
- Password: at least 8 Unicode characters, not whitespace-only, no NUL, and no
  more than 72 UTF-8 bytes to prevent bcrypt truncation. The password itself is
  not trimmed. There is no new uppercase/number/symbol composition requirement.
- Confirmation: required and exactly equal to the password, on client and server.

Guest login now has field-level required/email/password checks and retains its
existing server checks for account credentials and verified email. Existing
passwords keep the prior login policy; the new registration rules do not lock out
old passwords. Registration/login/resend have immediate submission guards and
loading states. Eye toggles, modal structure and verification/resend flow remain.
A pre-existing synchronous state-reset effect in AuthModal was replaced by resets
in its event handlers; reopening after errors no longer preserves stale warnings.

## Existing email: what can be established

1. Syntax checks catch malformed addresses.
2. Server DNS checks look for MX mail-routing records. A null MX explicitly
   rejects a no-mail domain. With no MX, standard A/AAAA fallback is allowed.
   Temporary DNS failures produce a retryable 503, not a false "fake email" verdict.
3. A pending account receives a random, time-limited, one-use verification link.
   Until that link is opened, the account remains unverified and neither login
   endpoint issues a JWT.

DNS cannot prove that an individual mailbox exists. An invented local-part at a
real provider can pass format/domain checks and be saved as PENDING, but cannot
sign in without mailbox access and verification. SMTP acceptance alone is not
proof either: some servers accept mail before bouncing it later. Do not describe
format/DNS checks as guaranteeing an existing mailbox.

The registration UI now says "Email address to verify" and displays the actual
send result, including mail failures. Unconfigured SMTP no longer prints message
bodies or verification links to the server console. Without SMTP, an account
stays pending; use resend after configuring mail delivery.

## Configure actual verification email delivery

Keep your existing DATABASE_URL/JWT_SECRET and other settings. Add your own mail
provider's settings to `server/.env` (or its hosting environment), for example:

```dotenv
SMTP_HOST=your-mail-provider-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mail-provider-username
SMTP_PASS=your-mail-provider-password-or-app-password
MAIL_FROM=Zenora <your-authorized-sender@example.com>
FRONTEND_URL=http://localhost:5173
```

Those are placeholders, not working credentials. Use the port/security combination
specified by your provider. `MAIL_FROM` must be a sender authorized by that
provider. Use your actual frontend URL if Vite runs on another port, and the HTTPS
frontend URL for a hosted deployment. Restart the backend after changing its env.
For local browser testing, keep `client/.env` VITE_API_URL pointed to your local API
(for example `http://localhost:4000`) and restart Vite after changing it.

Do not commit .env or mail passwords. Test using an inbox you can open: register,
check the inbox/spam folder, click the link, then log in with your password. Test
that the same link cannot be reused. Until SMTP is configured, sending fails even
for a real email address; that is a delivery configuration issue.

## Verification performed

- 39 automated tests passed: 10 client, 29 server (including the earlier tests).
- Registration API tests cover malformed fields, exact confirmation, Unicode
  password bounds, duplicate accounts, domain rejection, pending-account/no-JWT
  behavior, SMTP failure notices, normalized phone/email and preserved passwords.
- DNS tests cover MX, null MX, implicit A/AAAA fallback, nonexistent domains and
  retryable lookup failures using fixtures.
- Verification tests cover forged, expired, valid and reused tokens. Mailer tests
  confirm that unconfigured SMTP does not print verification URLs.
- Local Chromium tests passed for all field errors, eye toggle, duplicate submit
  guard, payload/normalization, server-error focus, retained input, verification
  notices/resend, unverified login, reopen resets and mobile layout/runtime errors.
- Existing appointment/staff-login browser checks passed again.
- Production frontend build passed, with the existing large-bundle warning.
- AuthModal and the new client validator pass ESLint. AuthContext's only change is
  forwarding confirmPassword; its pre-existing effect/export lint issues remain.
- No real emails were sent and no live Supabase/SMTP credentials were used.
  DNS fixtures and sample browser responses cannot confirm your deployment's
  mail delivery, DNS access or database connectivity.

References:
- https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html
- https://www.rfc-editor.org/rfc/rfc7505.html
- https://www.rfc-editor.org/rfc/rfc5321.html#section-5.1
- Existing bcryptjs package README (72-byte UTF-8 limit).
