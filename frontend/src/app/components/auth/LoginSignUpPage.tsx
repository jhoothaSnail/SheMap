import { useState } from "react";
import { Eye, EyeOff, Lock, MapPin, Route, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  getAuthErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  signUpWithEmail,
} from "../../auth/authService";

interface LoginSignUpPageProps {
  onLoginSuccess: () => void;
}

export default function LoginSignUpPage({ onLoginSuccess }: LoginSignUpPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (mode === "signup" && form.password.length < 8) e.password = "Minimum 8 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setAuthError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await loginWithEmail({ email: form.email, password: form.password });
      } else {
        await signUpWithEmail({ name: form.name, email: form.email, password: form.password });
      }
      onLoginSuccess();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrors({});
    setAuthError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: "login" | "signup") => {
    if (loading) return;
    setMode(next);
    setErrors({});
    setAuthError("");
    setForm({ name: "", email: "", password: "" });
    setShowPassword(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "#fdf6f9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: "min(390px, 100vw)",
          minHeight: "min(844px, 100vh)",
          background: "#ffffff",
          borderRadius: "min(44px, 5vw)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(201,64,118,0.16)",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="flex items-center justify-between px-6 pt-4 pb-1 shrink-0" style={{ background: "#ffffff" }}>
          <span className="text-xs font-semibold" style={{ color: "#1c0f18", letterSpacing: "0.02em" }}>
            9:41
          </span>
          <div className="flex items-center gap-1.5">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              {[3, 5, 7, 9].map((h, i) => (
                <rect
                  key={i}
                  x={i * 4}
                  y={12 - h}
                  width="3"
                  height={h}
                  rx="1"
                  fill="#1c0f18"
                  opacity={i < 3 ? 1 : 0.3}
                />
              ))}
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="#1c0f18" />
              <path d="M3.5 6.5C4.9 5.1 6.4 4.4 8 4.4s3.1.7 4.5 2.1" stroke="#1c0f18" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
              <path d="M1 3.8C3.1 1.7 5.4.8 8 .8s4.9.9 7 2.9" stroke="#1c0f18" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#1c0f18" strokeOpacity="0.35" />
              <rect x="2" y="2" width="16" height="8" rx="2" fill="#1c0f18" />
              <path d="M22.5 4v4a2 2 0 0 0 0-4Z" fill="#1c0f18" opacity="0.4" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -30 : 30 }}
              transition={{ duration: 0.22 }}
            >
              <div
                className="relative mx-5 mt-4 rounded-3xl overflow-hidden flex flex-col items-center justify-end"
                style={{
                  height: 200,
                  background: "linear-gradient(160deg, #fdeef4 0%, #fce8f0 58%, #fdd4e7 100%)",
                }}
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 200" preserveAspectRatio="xMidYMid slice">
                  {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x) => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="200" stroke="rgba(201,64,118,0.1)" strokeWidth="1" />
                  ))}
                  {[40, 80, 120, 160].map((y) => (
                    <line key={`h${y}`} x1="0" y1={y} x2="380" y2={y} stroke="rgba(201,64,118,0.1)" strokeWidth="1" />
                  ))}
                  <path
                    d="M60 170 Q100 140 150 120 Q200 100 240 80 Q290 55 330 40"
                    fill="none"
                    stroke="#c94076"
                    strokeWidth="2.5"
                    strokeDasharray="5 8"
                    strokeLinecap="round"
                  />
                  {[[60, 170], [150, 120], [240, 80], [330, 40]].map(([x, y], i) => (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={i === 0 || i === 3 ? 7 : 4}
                        fill={i === 0 ? "#c94076" : i === 3 ? "#f07c4a" : "white"}
                        stroke={i === 0 || i === 3 ? "white" : "#c94076"}
                        strokeWidth="1.5"
                      />
                      {(i === 0 || i === 3) && (
                        <circle cx={x} cy={y} r={12} fill={i === 0 ? "rgba(201,64,118,0.15)" : "rgba(240,124,74,0.15)"} />
                      )}
                    </g>
                  ))}
                  <circle cx="240" cy="80" r="28" fill="rgba(201,64,118,0.07)" stroke="rgba(201,64,118,0.2)" strokeWidth="1" strokeDasharray="3 4" />
                </svg>

                <div className="relative z-10 flex flex-col items-center pb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #c94076 0%, #f07c4a 100%)" }}
                    >
                      <MapPin size={18} className="text-white" />
                    </div>
                    <span
                      className="text-2xl"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: "#1c0f18" }}
                    >
                      SheMaps
                    </span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "#8a6078" }}>Navigate safely, every step</p>
                </div>
              </div>

              <div className="px-5 pt-6 pb-8">
                <div className="flex p-1 rounded-2xl mb-6" style={{ background: "#f5eaf0" }}>
                  {(["login", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={loading}
                      onClick={() => switchMode(m)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                      style={
                        mode === m
                          ? {
                              background: "#ffffff",
                              color: "#c94076",
                              boxShadow: "0 1px 8px rgba(201,64,118,0.18)",
                            }
                          : { color: "#8a6078" }
                      }
                    >
                      {m === "login" ? "Log in" : "Sign up"}
                    </button>
                  ))}
                </div>

                <h2
                  className="text-2xl mb-1"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, color: "#1c0f18" }}
                >
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-sm mb-6" style={{ color: "#8a6078" }}>
                  {mode === "login" ? "Log in to your safe space" : "Join thousands of women navigating safely"}
                </p>

                {authError && (
                  <div
                    className="mb-4 rounded-2xl px-4 py-3 text-sm"
                    style={{ background: "rgba(217,48,37,0.08)", border: "1px solid rgba(217,48,37,0.22)", color: "#9f1d16" }}
                    role="alert"
                  >
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <AndroidField
                          label="Full name"
                          type="text"
                          placeholder="Priya Sharma"
                          value={form.name}
                          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                          error={errors.name}
                          disabled={loading}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AndroidField
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    error={errors.email}
                    disabled={loading}
                  />

                  <div>
                    <label
                      className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
                      style={{ color: "#8a6078", letterSpacing: "0.06em" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        disabled={loading}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
                        className="w-full rounded-2xl px-4 py-3.5 pr-12 text-sm outline-none transition-all disabled:opacity-70"
                        style={{
                          background: "#f7eef3",
                          border: errors.password ? "1.5px solid #d93025" : "1.5px solid transparent",
                          color: "#1c0f18",
                        }}
                        onFocus={(e) => (e.currentTarget.style.border = "1.5px solid #c94076")}
                        onBlur={(e) => (e.currentTarget.style.border = errors.password ? "1.5px solid #d93025" : "1.5px solid transparent")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: "#8a6078" }}
                        tabIndex={-1}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs mt-1" style={{ color: "#d93025" }}>{errors.password}</p>
                    )}
                  </div>

                  {mode === "signup" && form.password.length > 0 && (
                    <PasswordStrength password={form.password} />
                  )}

                  {mode === "login" && (
                    <div className="text-right -mt-1">
                      <button type="button" className="text-xs font-medium" style={{ color: "#c94076" }} disabled={loading}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-75"
                    style={{
                      background: "linear-gradient(135deg, #c94076 0%, #a83060 100%)",
                      color: "#ffffff",
                      boxShadow: "0 6px 20px rgba(201,64,118,0.35)",
                      marginTop: 8,
                    }}
                  >
                    {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
                  </button>

                  <div className="flex items-center gap-3 py-1">
                    <hr className="flex-1" style={{ borderColor: "rgba(201,64,118,0.15)" }} />
                    <span className="text-xs" style={{ color: "#8a6078" }}>or continue with</span>
                    <hr className="flex-1" style={{ borderColor: "rgba(201,64,118,0.15)" }} />
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-75"
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid rgba(201,64,118,0.2)",
                      color: "#1c0f18",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                    }}
                  >
                    <GoogleIcon />
                    Google
                  </button>
                </form>

                <p className="text-center text-sm mt-6" style={{ color: "#8a6078" }}>
                  {mode === "login" ? "New here? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                    className="font-semibold"
                    style={{ color: "#c94076" }}
                    disabled={loading}
                  >
                    {mode === "login" ? "Sign up" : "Log in"}
                  </button>
                </p>

                <div className="flex items-center justify-center gap-4 mt-8">
                  {[
                    { icon: Lock, label: "Encrypted" },
                    { icon: Shield, label: "Private" },
                    { icon: Route, label: "Safe routes" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <Icon size={16} style={{ color: "#c94076" }} />
                      <span className="text-xs" style={{ color: "#b08898" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center py-3 shrink-0" style={{ background: "#ffffff" }}>
          <div className="w-32 h-1 rounded-full" style={{ background: "#1c0f18", opacity: 0.15 }} />
        </div>
      </div>
    </div>
  );
}

function AndroidField({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 tracking-wide"
        style={{ color: "#8a6078", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.7rem" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all disabled:opacity-70"
        style={{
          background: "#f7eef3",
          border: error ? "1.5px solid #d93025" : "1.5px solid transparent",
          color: "#1c0f18",
        }}
        onFocus={(e) => (e.currentTarget.style.border = "1.5px solid #c94076")}
        onBlur={(e) => (e.currentTarget.style.border = error ? "1.5px solid #d93025" : "1.5px solid transparent")}
      />
      {error && <p className="text-xs mt-1" style={{ color: "#d93025" }}>{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const label = ["Too short", "Weak", "Fair", "Good", "Strong"][score];
  const color = ["#d93025", "#f07c4a", "#f0b429", "#5aab61", "#1a8f46"][score];

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? color : "#e8c8d6" }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
      <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.9l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
      <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
      <path fill="#FBBC05" d="M5.277 14.191A7.18 7.18 0 0 1 4.909 12a7.277 7.277 0 0 1 .374-2.265L1.257 6.62A11.804 11.804 0 0 0 0 12c0 1.93.445 3.754 1.257 5.38l4.02-3.189Z" />
    </svg>
  );
}
