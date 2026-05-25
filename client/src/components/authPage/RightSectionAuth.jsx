import React, { useRef, useState } from "react";
import API from "../../api/AuthApi";
import toast from "react-hot-toast";

const RightSectionAuth = () => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setusername] = useState("");
  const [loading, setLoading] = useState(false);

  //helper function
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
  };

 // api caller
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;

      if (tab === "login") {
        response = await API.post("/login", { email, password });
        toast.success(response.data.message || "Welcome back!");
        console.log("Logged in user:");
      } else {
        response = await API.post("/signup", { email, password, username });
        toast.success(
          response.data.message || "Account created! Please sign in.",
        );
        resetForm();
        setTab("login");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const onGoogleHandler = () => {
    window.location.href = `${import.meta.env.VITE_API}/auth/google`;
    console.log("Google auth");
  };

  return (
    <div
      className="
    relative
    z-10
    w-[90dvw]
    min-h-[50dvh]
    lg:w-1/2
    lg:h-[80dvh]

    bg-[#333]/20
    backdrop-blur-2xl

    rounded-3xl
    overflow-hidden

    shadow-[0_8px_32px_rgba(230,0,255,0.37)]


    flex
    justify-center
    p-6
  "
    >
      {/* reflective layer */}
      <div
        className="
      absolute
      inset-0
      rounded-3xl
      bg-gradient-to-br
      from-teansparent
      to-white/20
      pointer-events-none
      z-0
      flex
      justify-center

    "
      />

      {/* scrollable content */}
      <div className="relative z-10 w-full max-w-sm mx-auto overflow-y-scroll lg:overflow-hidden ">
        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              {tab === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {tab === "login"
                ? "Sign in to continue to your account"
                : "Join the arena today"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0 bg-white/[0.06] rounded-xl p-1">
            {["login", "signup"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`
                flex-1 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-200
                ${
                  tab === t
                    ? "bg-purple-600/40 text-purple-100 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                    : "text-white/30 hover:text-white/50"
                }
              `}
              >
                {t === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={onSubmitHandler} className="flex flex-col gap-5">
            {/* username — signup only */}
            {tab === "signup" && (
              <div className="relative">
                <UserIcon />
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                  required
                  className="auth-field pl-10 text-white"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <MailIcon />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-field pl-10 text-white outline-none"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <LockIcon />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-field pl-10 text-white outline-none "
              />
            </div>

            {/* Forgot password — login only */}
            {tab === "login" && (
              <div className="text-right -mt-1">
                <span className="text-xs text-purple-300/50 hover:text-purple-300/80 cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
              w-full py-3 mt-1 rounded-xl
              bg-purple-600/50 hover:bg-purple-600/70
              border border-purple-400/30
              text-white text-sm font-semibold tracking-wide
              shadow-[0_0_20px_rgba(168,85,247,0.3)]
              hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            >
              {loading
                ? "Please wait..."
                : tab === "login"
                  ? "Sign in"
                  : "Create Account"}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/25 tracking-widest uppercase">
              or
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={onGoogleHandler}
            className="
            w-full py-3 flex items-center justify-center gap-3
            bg-white/[0.07] hover:bg-white/[0.12]
            border border-white/15 hover:border-white/25
            rounded-xl text-white/70 hover:text-white/90
            text-sm font-medium
            transition-all duration-200
          "
          >
            <GoogleIcon />
            {tab === "login" ? "Continue with Google" : "Sign up with Google"}
          </button>

          {/* Switch tab hint */}
          <p className="text-center text-xs text-white/25">
            {tab === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <span
                  onClick={() => setTab("signup")}
                  className="text-purple-300/60 hover:text-purple-300 cursor-pointer transition-colors"
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => setTab("login")}
                  className="text-purple-300/60 hover:text-purple-300 cursor-pointer transition-colors"
                >
                  Sign in
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
const MailIcon = () => (
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);

export default RightSectionAuth;
