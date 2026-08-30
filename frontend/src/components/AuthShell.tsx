import type { ReactNode } from "react";
import { Cloud, FolderKey, LockKeyhole, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#eef2f7] text-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1fr_440px]">
        <section className="flex flex-col justify-between px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
              <Cloud size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cloud Storage</p>
              <h1 className="text-xl font-semibold text-ink">Media File Storage Service</h1>
            </div>
          </div>

          <div className="my-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Secure drive workspace</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Upload, organize, and share files with role-based access.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Feature icon={<LockKeyhole size={18} />} label="HttpOnly auth cookies" />
              <Feature icon={<FolderKey size={18} />} label="Folder permissions" />
              <Feature icon={<ShieldCheck size={18} />} label="Protected APIs" />
            </div>
          </div>

          <p className="text-sm text-slate-500">Backend API: FastAPI, PostgreSQL, Supabase Storage</p>
        </section>

        <section className="flex items-center px-5 pb-8 sm:px-8 lg:px-0 lg:py-8">{children}</section>
      </div>
    </main>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
      <span className="text-brand">{icon}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}
