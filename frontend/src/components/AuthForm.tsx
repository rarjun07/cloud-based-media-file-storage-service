import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { useLogin, useRegister } from "../hooks/useAuth";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const login = useLogin();
  const register = useRegister();
  const isSignup = mode === "signup";
  const isLoading = login.isPending || register.isPending;
  const error = login.error ?? register.error;
  const title = isSignup ? "Create your account" : "Welcome back";
  const subtitle = isSignup
    ? "Register with your details and start managing your cloud workspace."
    : "Login to upload, organize, share, and recover your files securely.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    try {
      if (isSignup) {
        await register.mutateAsync({
          email,
          password,
          full_name: fullName || undefined,
        });
        await login.mutateAsync({ email, password });
        setMessage("Account created.");
        return;
      }

      await login.mutateAsync({ email, password });
    } catch {
      setMessage(null);
    }
  }

  return (
    <div className="w-full rounded-lg border border-white/90 bg-white/90 p-5 shadow-soft backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">Account access</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
          {isSignup ? <UserPlus size={22} aria-hidden="true" /> : <LogIn size={22} aria-hidden="true" />}
        </div>
      </div>

      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Authentication mode">
        <button
          className={`rounded-md px-3 py-3 text-sm font-extrabold transition ${
            mode === "login" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
          }`}
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={`rounded-md px-3 py-3 text-sm font-extrabold transition ${
            mode === "signup" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
          }`}
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Register
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        {isSignup ? (
          <Field
            label="Full name"
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={setFullName}
          />
        ) : null}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={setPassword}
          minLength={isSignup ? 8 : 1}
          maxLength={72}
          required
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" role="alert">
            {getApiErrorMessage(error)}
          </div>
        ) : null}

        {message ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" />
            {message}
          </div>
        ) : null}

        <button
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          {isSignup ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          {isSignup ? "Create account" : "Login"}
        </button>
      </form>

      <div className="mt-5 grid gap-2 rounded-lg border border-line bg-slate-50 p-3">
        <TrustLine text="JWT auth with HttpOnly cookies" />
        <TrustLine text="Role-based file and folder sharing" />
        <TrustLine text="Signed upload flow for protected storage" />
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  minLength,
  maxLength,
}: FieldProps) {
  return (
    <label className="block text-sm font-extrabold text-slate-700" htmlFor={name}>
      <span>{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 font-semibold text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-blue-100"
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TrustLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
      <CheckCircle2 className="shrink-0 text-mint" size={15} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
