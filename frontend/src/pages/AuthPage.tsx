import { useEffect, useState } from "react";

import { AuthForm } from "../components/AuthForm";
import { AuthShell } from "../components/AuthShell";
import type { AuthMode } from "../components/AuthForm";
import type { PublicPage } from "../components/AuthShell";

export function AuthPage() {
  const [page, setPage] = useState<PublicPage>(() => getPublicPageFromPath());
  const mode: AuthMode = page === "register" ? "signup" : "login";

  useEffect(() => {
    function handlePopState() {
      setPage(getPublicPageFromPath());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(pageName: PublicPage) {
    const path = pageName === "home" ? "/" : `/${pageName}`;
    window.history.pushState(null, "", path);
    setPage(pageName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setMode(nextMode: AuthMode) {
    navigate(nextMode === "signup" ? "register" : "login");
  }

  return (
    <AuthShell activePage={page} onNavigate={navigate}>
      {page === "home" ? null : <AuthForm mode={mode} onModeChange={setMode} showModeToggle={false} />}
    </AuthShell>
  );
}

function getPublicPageFromPath(): PublicPage {
  if (window.location.pathname === "/login") {
    return "login";
  }
  if (window.location.pathname === "/register") {
    return "register";
  }
  return "home";
}
