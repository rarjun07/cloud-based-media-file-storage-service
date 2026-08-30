import { AuthForm } from "../components/AuthForm";
import { AuthShell } from "../components/AuthShell";

export function AuthPage() {
  return (
    <AuthShell>
      <AuthForm />
    </AuthShell>
  );
}
