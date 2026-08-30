import type { ReactNode } from "react";
import {
  ArrowRight,
  Cloud,
  Database,
  FileSearch,
  FolderKey,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
  UsersRound,
} from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#eef4f8] text-ink">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(15,159,110,0.16),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#edf4f8_48%,#e7eef5_100%)]" />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] text-white shadow-lg shadow-blue-900/15">
              <Cloud size={23} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Cloud Storage</p>
              <h1 className="truncate text-base font-extrabold text-ink sm:text-lg">Media File Storage Service</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
            <a className="rounded-full bg-white px-3 py-2 shadow-sm hover:text-brand" href="#features">
              Features
            </a>
            <a className="rounded-full bg-white px-3 py-2 shadow-sm hover:text-brand" href="#security">
              Security
            </a>
            <a className="rounded-full bg-brand px-4 py-2 text-white shadow-sm hover:bg-blue-700" href="#access">
              Login
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_470px] lg:py-10">
          <section className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-brand shadow-sm backdrop-blur">
              <ShieldCheck size={15} aria-hidden="true" />
              Secure drive workspace
            </div>

            <div className="mt-6 max-w-3xl">
              <h2 className="text-4xl font-black leading-[1.03] text-ink sm:text-6xl lg:text-7xl">
                Store, organize, and share media files from one clean workspace.
              </h2>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                A production-ready cloud storage MVP with FastAPI, PostgreSQL, Supabase Storage, protected auth,
                folder hierarchy, sharing permissions, search, upload progress, and trash recovery.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-5 text-sm font-extrabold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                href="#access"
              >
                Start now
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-white/80 px-5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-white"
                href="#features"
              >
                View features
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3" id="features">
              <Feature icon={<UploadCloud size={19} />} label="Direct uploads" value="100 MB" />
              <Feature icon={<FolderKey size={19} />} label="Folder access" value="RBAC" />
              <Feature icon={<FileSearch size={19} />} label="Search filters" value="Fast" />
            </div>

            <ProductPreview />
          </section>

          <section id="access" className="flex items-center">{children}</section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-white/70 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Backend API: FastAPI, PostgreSQL, Supabase Storage</span>
          <span>JWT cookies, signed uploads, role-based sharing</span>
        </footer>
      </div>
    </main>
  );
}

function Feature({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-lg border border-white/90 bg-white/80 px-4 py-3 shadow-md shadow-slate-900/5 backdrop-blur">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">{value}</span>
        <span className="block text-sm font-extrabold text-slate-700">{label}</span>
      </span>
    </div>
  );
}

function ProductPreview() {
  return (
    <div
      className="mt-8 overflow-hidden rounded-lg border border-white/90 bg-white/75 shadow-soft backdrop-blur-xl"
      id="security"
    >
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Drive preview</span>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[190px_1fr]">
        <div className="grid gap-2">
          <PreviewNav icon={<Cloud size={17} />} label="My Drive" active />
          <PreviewNav icon={<UsersRound size={17} />} label="Shared" />
          <PreviewNav icon={<Database size={17} />} label="Storage" />
          <PreviewNav icon={<LockKeyhole size={17} />} label="Trash" />
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewMetric label="Files" value="128" />
            <PreviewMetric label="Shared" value="24" />
            <PreviewMetric label="Used" value="8.4 GB" />
          </div>
          <div className="grid gap-2 rounded-lg bg-slate-50 p-3">
            {["Project-media.zip", "Brand-assets", "Client-demo.mp4"].map((name, index) => (
              <div className="flex items-center justify-between rounded-lg bg-white px-3 py-3 shadow-sm" key={name}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-9 w-9 rounded-lg bg-blue-50" />
                  <span className="truncate text-sm font-extrabold text-slate-700">{name}</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{index === 0 ? "12 MB" : "Folder"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewNav({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-extrabold ${
        active ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-500"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/70 bg-white px-3 py-3 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <strong className="mt-1 block text-lg font-black text-ink">{value}</strong>
    </div>
  );
}
