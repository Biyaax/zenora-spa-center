import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const FALLBACK_API_BASE =
  "https://zenora-spa-api-git-bea-supabase-migration-biyaaxs-projects.vercel.app";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  FALLBACK_API_BASE
).replace(/\/$/, "");

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] =
    useState("loading");

  const [message, setMessage] =
    useState(
      "We're verifying your email address..."
    );

  useEffect(() => {
    const verificationToken =
      searchParams.get("token");

    if (!verificationToken) {
      setStatus("error");
      setMessage(
        "This verification link is invalid."
      );
      return;
    }

    let cancelled = false;

    async function verifyEmail() {
      try {
        const response = await fetch(
          `${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(
            verificationToken
          )}`
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Email verification failed."
          );
        }

        if (!cancelled) {
          setStatus("success");

          setMessage(
            data.message ||
              "Your email has been verified successfully."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");

          setMessage(
            error.message ||
              "Email verification failed."
          );
        }
      }
    }

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div
      className="container-fluid py-5"
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="bg-light p-5 text-center"
        style={{
          width: "100%",
          maxWidth: "620px",
          borderRadius: "8px",
        }}
      >
        {status === "loading" && (
          <>
            <div className="mb-4">
              <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
            </div>

            <h2 className="mb-3">
              Verifying Email
            </h2>

            <p className="text-muted mb-0">
              {message}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-4">
              <i className="fas fa-check-circle fa-3x text-primary"></i>
            </div>

            <h2 className="mb-3">
              Email Verified!
            </h2>

            <p className="text-muted">
              {message}
            </p>

            <p>
              Your Zenora account is now
              ready to use.
            </p>

            <Link
              to="/"
              className="btn btn-primary py-2 px-4 mt-3"
            >
              Continue to Zenora
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-4">
              <i className="fas fa-exclamation-circle fa-3x text-danger"></i>
            </div>

            <h2 className="mb-3">
              Verification Failed
            </h2>

            <p className="text-danger">
              {message}
            </p>

            <p className="text-muted">
              You can return to Zenora and
              request another verification
              email.
            </p>

            <Link
              to="/"
              className="btn btn-primary py-2 px-4 mt-3"
            >
              Return Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;