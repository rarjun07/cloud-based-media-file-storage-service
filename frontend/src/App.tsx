import { LoadingState } from "./components/StatusState";
import { useCurrentUser } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PublicLinkPage } from "./pages/PublicLinkPage";

export default function App() {
  const publicLinkToken = getPublicLinkToken();
  const { data: user, isLoading } = useCurrentUser();

  if (publicLinkToken) {
    return <PublicLinkPage token={publicLinkToken} />;
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f7] text-ink">
        <LoadingState label="Checking session" />
      </main>
    );
  }

  return user ? <DashboardPage /> : <AuthPage />;
}

function getPublicLinkToken() {
  const match = window.location.pathname.match(/^\/public-link\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
