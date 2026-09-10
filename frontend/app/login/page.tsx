"use client";

import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calculator,
  HardHat,
  Store,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendVerificationEmail,
    refreshUser,
    loading,
  } = useAuth();

  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        return "This email address is already registered. Please log in.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password credentials.";
      case "auth/unauthorized-domain":
        return "This deployed domain is not authorized in Firebase Console! Go to Firebase Console > Authentication > Settings > Authorized Domains and add your domain.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/operation-not-allowed":
        return "Google sign-in provider is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.";
      default:
        return "Authentication failed. Please check your network and try again.";
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError("");
    setFormInfo("");
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormInfo("");

    if (!email || !password) {
      setFormError("Email and password fields are required.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setFormError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, fullName.trim());
        setFormInfo("Verification email sent to your inbox. Please check and verify.");
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
      setFormInfo("A new verification email has been sent. Please check your inbox.");
    } catch (error) {
      setFormError("Unable to resend verification email. Please try again later.");
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FCFAF7] text-[#281713]">
      {/* Left Column - Dark Luxury Architectural Branding Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1c1108] text-[#FCFAF7] flex-col justify-between p-12 lg:p-16 overflow-hidden">
        {/* Background Image */}
        <Image
          src="/loginbg.jpg"
          alt="Architectural Construction Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark Vignette Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1108] via-[#1c1108]/75 to-[#1c1108]/40 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#8B4434]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#8B4434]/20 blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="BuildMe.lk Logo"
              width={150}
              height={40}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Hero Value Propositions */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-12">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#8B4434] bg-[#8B4434]/15 px-3.5 py-1.5 border border-[#8B4434]/30">
              Sri Lanka Construction Platform
            </span>
            <h1 className="font-serif text-4xl xl:text-5xl font-light text-[#FCFAF7] leading-tight">
              Build Smarter with Complete Project Transparency
            </h1>
            <p className="text-sm text-[#FCFAF7]/70 leading-relaxed font-light">
              Access smart AI estimation tools, source verified Sri Lankan materials, and connect with certified professionals.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4 p-4 border border-[#FCFAF7]/10 bg-[#FCFAF7]/5">
              <div className="p-2.5 bg-[#8B4434]/20 text-[#8B4434] shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-semibold text-[#FCFAF7]">Smart Cost Estimator</h4>
                <p className="text-xs text-[#FCFAF7]/60 mt-0.5">
                  Calculate instant material & labor costs based on your land area and floor count.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-[#FCFAF7]/10 bg-[#FCFAF7]/5">
              <div className="p-2.5 bg-[#8B4434]/20 text-[#8B4434] shrink-0">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-semibold text-[#FCFAF7]">Verified Professionals</h4>
                <p className="text-xs text-[#FCFAF7]/60 mt-0.5">
                  Hire verified contractors, quantity surveyors, structural engineers & architects.
                </p>
              </div>
            </div>

            
          </div>
        </div>

        {/* Footer Badge */}
        <div className="relative z-10 flex items-center gap-3 pt-6 border-t border-[#FCFAF7]/10 text-xs text-[#FCFAF7]/60">
          <ShieldCheck className="w-4 h-4 text-[#8B4434]" />
          <span>SSL Secured Authentication & Verified Network</span>
        </div>
      </div>

      {/* Right Column - Quiet Luxury Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Header Navigation & Title */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8B4434] hover:text-[#6f3829] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            <div className="lg:hidden pb-2">
              <Image
                src="/logo.png"
                alt="BuildMe.lk"
                width={130}
                height={35}
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#281713]">
                {mode === "signup" ? "Create Account" : "Sign In to BuildMe"}
              </h2>
              <p className="text-xs sm:text-sm text-[#606060] mt-1.5">
                {mode === "signup"
                  ? "Register as a homeowner or professional to start managing estimates."
                  : "Welcome back. Access your saved project estimations and active bids."}
              </p>
            </div>
          </div>

          {/* Email Verification Alert Banner */}
          {requiresVerification && (
            <div className="p-5 border border-[#efe6df] bg-[#fff7ed] text-[#281713] space-y-3">
              <div className="flex items-center gap-2 text-[#8B4434]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Email Verification Required</h4>
              </div>
              <p className="text-xs text-[#606060] leading-relaxed">
                A verification email was sent to <span className="font-semibold text-[#281713]">{user?.email}</span>. Please verify your email to unlock your workspace.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isSendingVerification}
                  className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {isSendingVerification ? "Sending..." : "Resend Email"}
                </button>
                <button
                  type="button"
                  onClick={handleRefreshVerification}
                  disabled={isRefreshingVerification}
                  className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {isRefreshingVerification ? "Checking..." : "I Have Verified"}
                </button>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex border border-[#efe6df] bg-[#fcfaf9] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "login"
                  ? "bg-[#8B4434] text-white shadow-xs"
                  : "text-[#606060] hover:text-[#281713]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === "signup"
                  ? "bg-[#8B4434] text-white shadow-xs"
                  : "text-[#606060] hover:text-[#281713]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]/80">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full border border-[#efe6df] bg-white text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]/80">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full border border-[#efe6df] bg-white text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]/80">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full border border-[#efe6df] bg-white text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8B4434]/80">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full border border-[#efe6df] bg-white text-[#281713] px-4 py-3 text-sm focus:outline-none focus:border-[#8B4434] transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Info Message */}
            {formInfo && (
              <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formInfo}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full btn-primary py-3.5 text-xs font-semibold uppercase tracking-widest disabled:opacity-60"
            >
              {isSubmitting
                ? "Processing..."
                : mode === "signup"
                ? "Create Account"
                : "Sign In to Workspace"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#efe6df] w-full" />
            <span className="bg-[#FCFAF7] px-3 text-[10px] uppercase tracking-widest font-semibold text-stone-400 absolute">
              OR
            </span>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || isSubmitting}
            className="w-full border border-[#efe6df] bg-white text-[#281713] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider hover:border-[#8B4434] hover:bg-[#fcfaf9] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}