import { FormEvent, useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

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
  }

  return (
    <div className="w-full rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
        <button
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-white text-ink shadow-sm" : "text-slate-600"
          }`}
          type="button"
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-white text-ink shadow-sm" : "text-slate-600"
          }`}
          type="button"
          onClick={() => setMode("signup")}
        >
          Sign up
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(error)}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          {isSignup ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          {isSignup ? "Create account" : "Login"}
        </button>
      </form>
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
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      <span>{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-blue-100"
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
