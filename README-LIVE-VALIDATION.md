# Live validation only

This correction keeps the safely merged member update and both earlier validation patches.
It retains live registration/login/appointment feedback and debounced email-domain checking.
It removes the pending password-recovery feature and its schema/session-version dependency.
No database migration or connection-string change is required by this update.
Forgot Password remains disabled; its complete recovery flow is deferred.

Apply this correction after the live-validation/reset patch that was already applied.
Restart your existing backend and frontend with their normal npm run dev commands.
Existing SMTP configuration is still needed for the earlier registration verification email.
The test commands return to the prior 39 tests.
