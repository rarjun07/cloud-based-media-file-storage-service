import { Loader2 } from "lucide-react";

import { useCurrentUser } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { DashboardStub } from "./pages/DashboardStub";

export default function App() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-ink">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-brand" size={20} aria-hidden="true" />
          <span className="text-sm font-medium">Checking session</span>
        </div>
      </main>
    );
  }

  return user ? <DashboardStub /> : <AuthPage />;
}
