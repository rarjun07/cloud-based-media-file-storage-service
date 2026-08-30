import { LogOut, UserCircle } from "lucide-react";

import { useCurrentUser, useLogout } from "../hooks/useAuth";

export function DashboardStub() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <main className="min-h-screen bg-[#eef2f7] px-5 py-6 text-ink sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 rounded-lg border border-line bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white">
              <UserCircle size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Signed in</p>
              <h1 className="text-xl font-semibold">{user?.full_name || user?.email}</h1>
            </div>
          </div>
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </header>

        <section className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Dashboard setup starts on Day 9</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Authentication is connected. The next frontend task will add the Drive layout,
            sidebar, file listing, and breadcrumb navigation.
          </p>
        </section>
      </div>
    </main>
  );
}
