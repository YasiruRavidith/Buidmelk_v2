"use client";

import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendVerificationEmail,
    refreshUser,
    loading
  } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formInfo, setFormInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false);

  const requiresVerification = !!user && !loading && !user.emailVerified;

  const [redirectUrl, setRedirectUrl] = useState("/onboarding");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const red = params.get("redirect");
      if (red) {
        setRedirectUrl(red);
      }
    }
  }, []);

  useEffect(() => {
    if (user && !loading && user.emailVerified) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  useEffect(() => {
    setFormError("");
    setFormInfo("");
  }, [mode]);

  const getAuthErrorMessage = (error: unknown) => {
    const code = (error as { code?: string })?.code || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      default:
        return "Authentication failed. Please try again.";
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormInfo("");

    if (!email || !password) {
      setFormError("Email and password are required.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, fullName.trim());
        setFormInfo("Verification email sent. Please check your inbox.");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    setFormError("");
    setFormInfo("");

    try {
      await sendVerificationEmail();
      setFormInfo("Verification email resent. Please check your inbox.");
    } catch (error) {
      setFormError("Unable to send verification email. Please try again.");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleRefreshVerification = async () => {
    setIsRefreshingVerification(true);
    setFormError("");
    setFormInfo("");

    const verified = await refreshUser();
    setIsRefreshingVerification(false);

    if (verified) {
      router.push(redirectUrl);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative bg-orange-50 items-center justify-center border-r border-stone-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-transparent"></div>
        <div className="z-10 text-center space-y-6 px-12">
          <h2 className="font-serif text-4xl text-stone-800 italic">
            &quot;Architecture is the learned game, correct and magnificent, of forms assembled in the light.&quot;
          </h2>
          <p className="text-stone-500 uppercase tracking-[0.2em] text-sm">Le Corbusier</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-3">
            <Link href="/" className="text-orange-600 font-semibold tracking-widest uppercase text-sm hover:text-orange-700 transition">
              ← Back to Home
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
              Welcome to <span className="text-orange-600 block mt-2">BuildMe.lk</span>
            </h1>
            <p className="text-stone-500 text-lg">
              {mode === "signup"
                ? "Create your account to start managing projects and estimates."
                : "Sign in to manage your premium construction projects and estimates."}
            </p>
          </div>

          {requiresVerification && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Verify your email</h2>
              <p className="text-sm text-stone-600">
                We sent a verification link to {user?.email}. Please verify your email to continue.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isSendingVerification}
                  className="btn-secondary px-4 py-2 disabled:opacity-60"
                >
                  {isSendingVerification ? "Sending..." : "Resend email"}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshVerification}
                  disabled={isRefreshingVerification}
                  className="btn-primary px-4 py-2 disabled:opacity-60"
                >
                  {isRefreshingVerification ? "Checking..." : "I verified"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2 rounded-full bg-stone-100 p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  mode === "login" ? "bg-white shadow text-stone-900" : "text-stone-500"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  mode === "signup" ? "bg-white shadow text-stone-900" : "text-stone-500"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>
              {mode === "signup" && (
                <div>
                  <label className="block text-stone-500 font-medium text-sm tracking-wide mb-2">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full border border-stone-300 text-stone-700 rounded-lg px-4 py-3 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
              )}

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}
              {formInfo && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  {formInfo}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isSubmitting}
                className="w-full btn-primary py-4 text-lg disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-stone-200"></div>
              <span className="text-xs text-stone-400 uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-stone-200"></div>
            </div>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-lg shadow-sm hover:shadow-md hover:border-orange-200 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}