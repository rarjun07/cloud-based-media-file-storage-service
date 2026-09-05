import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { getGoogleLoginUrl } from "../services/auth";
import { useLogin, useRegister } from "../hooks/useAuth";

export type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  showModeToggle?: boolean;
};

export function AuthForm({ mode, onModeChange, showModeToggle = true }: AuthFormProps) {
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
    <div className="w-full rounded-[30px] border border-white/80 bg-white/74 p-6 shadow-[0_26px_70px_rgba(9,44,40,0.16)] backdrop-blur-xl sm:p-8">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#dbeeff] text-[#1c6a61] shadow-sm">
          {isSignup ? <UserPlus size={24} aria-hidden="true" /> : <LogIn size={24} aria-hidden="true" />}
        </div>
        <p className="inline-flex rounded-full bg-[#dbeaff] px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#49645f]">
          Account access
        </p>
        <h2 className="mt-4 text-4xl font-black leading-tight text-[#122622]">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#49645f]">{subtitle}</p>
      </div>

      {showModeToggle ? (
        <div className="grid grid-cols-2 rounded-2xl bg-[#e7f1ed] p-1" role="tablist" aria-label="Authentication mode">
          <button
            className={`rounded-xl px-3 py-4 text-sm font-extrabold transition ${
              mode === "login" ? "bg-white text-[#122622] shadow-sm" : "text-[#6e827c] hover:text-[#122622]"
            }`}
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => onModeChange("login")}
          >
            Login
          </button>
          <button
            className={`rounded-xl px-3 py-4 text-sm font-extrabold transition ${
              mode === "signup" ? "bg-white text-[#122622] shadow-sm" : "text-[#6e827c] hover:text-[#122622]"
            }`}
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => onModeChange("signup")}
          >
            Register
          </button>
        </div>
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
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
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_74%,#62aa98_150%)] px-4 text-base font-extrabold text-[#f6fbf8] shadow-lg shadow-[#092c28]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#8ac7b0] disabled:shadow-none"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          {isSignup ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          {isSignup ? "Create account" : "Login"}
        </button>
      </form>

      <a
        className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-[#c8dcd5] bg-white/82 px-4 text-sm font-extrabold text-[#49645f] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#1c6a61]"
        href={getGoogleLoginUrl()}
      >
        Continue with Google
      </a>

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/70 bg-[#eef7f3]/80 p-4">
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
    <label className="block text-base font-extrabold text-[#122622]" htmlFor={name}>
      <span>{label}</span>
      <input
        className="mt-2 h-16 w-full rounded-2xl border border-[#c8dcd5] bg-[#f6fbf8]/86 px-5 text-base font-semibold text-[#122622] outline-none transition placeholder:text-[#8aa39b] focus:border-[#1c6a61] focus:ring-4 focus:ring-[#8ac7b0]/40"
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
    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#49645f]">
      <CheckCircle2 className="shrink-0 text-[#1c6a61]" size={15} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
