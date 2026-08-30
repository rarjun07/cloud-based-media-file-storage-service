import { LoadingState } from "./components/StatusState";
import { useCurrentUser } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-ink">
        <LoadingState label="Checking session" />
      </main>
    );
  }

  return user ? <DashboardPage /> : <AuthPage />;
}
