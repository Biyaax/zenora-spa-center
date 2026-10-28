# Zenora validation update for main c3083a6

This patch is rebuilt against commit `c3083a6b8507bd3e29d7cd5a3a2fc495e6fb143e`,
which includes the team's latest UI, password visibility and email verification work.
Use this revision instead of the earlier ZIP or patch based on the older snapshot.

## Apply in PowerShell

Download the revised `zenora-validation.patch` into Downloads, replacing the older
copy. Start in `C:\Users\PC\zenora-spa-center`. Your working tree must be clean.
Create a branch from your newly updated main, then check and apply the patch:

```powershell
git switch -c feature/appointment-staff-validation
$patch = Join-Path $env:USERPROFILE "Downloads\zenora-validation.patch"
git apply --check "$patch"
# Continue only if the check completed without errors:
git apply "$patch"
git diff --stat
```

If the branch already exists or a command reports an error, stop and inspect the
output rather than forcing the update. A failed `git apply --check` changes no files.
No commit, push, deployment, database migration, seed operation or .env change is
performed by the patch.

Run checks from the project root:

```powershell
npm --prefix .\server test
npm --prefix .\client test
npm --prefix .\client run build
```

Use `npm ci` inside each directory if you have not installed the latest main's
packages yet. This validation patch adds no production dependencies. The latest
main already includes the email-verification dependency and configuration.

Start the server and client in separate terminals from the project root:

```powershell
npm --prefix .\server run dev
```

```powershell
npm --prefix .\client run dev
```

Deploy the client and server together when ready: staff login now calls
`POST /api/auth/staff/login`. The original `/api/auth/login` endpoint remains.

## Preserved team changes

- Current home, footer, navbar, topbar removal, about and receptionist UI.
- Existing eye-icon password toggle and staff login layout.
- Current AuthModal and AuthContext behavior.
- Registration, verification/resend routes and the requirement that an account's
  email be verified before a login token is issued, on both login endpoints.
- Current staff API URL/environment selection, session token fallback, method,
  custom headers and request options. `staffRequest()` is unchanged.
- Existing availability imports and getService() implementation from latest main.

## Added validation

Appointments require a signed-in Guest account, a currently listed service,
therapist eligible for that service, valid open-day date in the spa timezone, and
an offered time. Existing Sunday closure and 60-minute online lead time remain.
The server rechecks opening/work hours, service duration, approved time off and
client/therapist overlaps, and requires the configured 30-minute start grid.

Name and email now display the authenticated account details as read-only.
Previously edits to those fields were not sent or saved by booking requests.
The form explains that the account details are used.

Changing service clears therapist/time; changing therapist/date clears time.
Stale responses are ignored. Special request is optional, trimmed and limited to
500 characters. Invalid types/NUL characters are rejected on the server. Errors
appear next to fields, focus moves to the first invalid field, failed submissions
retain values, and a 409 conflict clears/reloads available times. Success resets
the booking selections. Loading states and immediate guards block rapid repeats.
Text in the dark appointment form is made readable, with invalid-field borders.

Staff login checks email/password requirements and bounds, normalizes email,
preserves password bytes, and uses the team's existing eye toggle. A new staff
endpoint checks active account, password, supported staff role AND verified email
before issuing a token. Wrong credentials, missing/inactive users and guest
accounts use the same generic rejection. Existing guessing limits are retained
(8 failures per email/IP/15 minutes, in memory per API instance).

Malformed login/booking bodies and invalid/coercible IDs return validation errors.
A shared PostgreSQL transaction advisory lock serializes booking/reschedule/
reception availability checks and writes; it releases on commit/rollback and
requires no schema change. This is a coarse lock intended for this spa workload.

## Validation evidence

- 20 automated tests passed (5 client, 15 server), including unverified-account
  denial on BOTH login endpoints, role checks, input boundaries, schedule rules,
  conflict checks and transaction lock ordering.
- Production frontend build passed, with a bundle-size warning.
- ESLint passed on the four modified/new frontend JavaScript/JSX implementation
  files. Unrelated full-project lint errors were outside this update.
- Local Chromium checks with sample API responses passed for staff validation,
  the existing eye toggle, retained password/loading, verification error display,
  staffRequest method/headers/body/token fallback, appointment validation/conflict
  refresh/resets, mobile width, and absence of runtime errors.
- All 11 protected UI/authentication files and the staffRequest implementation
  were checked byte-for-byte against c3083a6.
- Tests used database fixtures. Live Supabase, SMTP delivery and real database
  contention have not been tested here; use your configured local environment
  before merging/deploying.
