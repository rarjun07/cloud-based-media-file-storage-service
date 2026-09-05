import type { AuthMode } from "./AuthForm";
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
  UserRound,
  UsersRound,
} from "lucide-react";

export type PublicPage = "home" | "login" | "register";

type AuthShellProps = {
  activePage: PublicPage;
  children: ReactNode;
  onNavigate: (page: PublicPage) => void;
};

export function AuthShell({ activePage, children, onNavigate }: AuthShellProps) {
  function selectAuthMode(mode: AuthMode) {
    onNavigate(mode === "signup" ? "register" : "login");
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#d8ebe2] text-[#122622]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_9%,rgba(255,255,255,0.62),transparent_25%),radial-gradient(circle_at_86%_4%,rgba(138,199,176,0.44),transparent_31%),linear-gradient(180deg,#e9f6f0_0%,#d7ebe2_45%,#b9d3c8_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:112px_112px] opacity-70 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.22),transparent_72%)]" />
      <div className="mx-auto flex min-h-dvh w-full max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="fixed left-1/2 top-5 z-50 flex w-[min(1500px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-4 rounded-[34px] border border-white/75 bg-white/72 px-5 py-5 shadow-[0_18px_48px_rgba(9,44,40,0.12)] backdrop-blur-xl sm:w-[min(1500px,calc(100%-3rem))] sm:flex-row sm:items-center sm:justify-between lg:w-[min(1500px,calc(100%-4rem))] lg:rounded-full lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_62%,#8ac7b0_150%)] text-[#f6fbf8] shadow-lg shadow-[#092c28]/25">
              <Cloud size={23} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black uppercase tracking-[0.08em] text-[#122622]">CloudDrive</h1>
              <p className="mt-0.5 text-sm font-semibold text-[#6e827c]">Media file storage service</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-extrabold text-[#49645f]">
            <button
              className={getNavClass(activePage === "home")}
              type="button"
              onClick={() => onNavigate("home")}
            >
              Home
            </button>
            <button
              className={getNavClass(activePage === "login")}
              type="button"
              onClick={() => selectAuthMode("login")}
            >
              Login
            </button>
            <button
              className={getNavClass(activePage === "register")}
              type="button"
              onClick={() => selectAuthMode("signup")}
            >
              Register
            </button>
            <button
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-[#f6fbf8]/82 text-[#1c6a61] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              type="button"
              aria-label="Account"
              title="Account"
              onClick={() => onNavigate(activePage === "register" ? "login" : "register")}
            >
              <UserRound size={22} aria-hidden="true" />
            </button>
          </nav>
        </header>

        <div className="mt-44 flex-1 rounded-[34px] border border-white/55 bg-[#eef7f3]/48 p-5 shadow-[0_30px_80px_rgba(9,44,40,0.14)] backdrop-blur-xl sm:mt-32 sm:p-7 lg:p-8">
          <div className="grid min-h-[calc(100dvh-190px)] items-center gap-10 lg:grid-cols-[minmax(0,0.94fr)_1fr]">
            {activePage === "home" ? (
              <HomeHero onNavigate={onNavigate} />
            ) : (
              <AuthHero page={activePage} />
            )}

            <section id="access" className="flex items-center">
              {activePage === "home" ? <HomeAccessPreview onNavigate={onNavigate} /> : children}
            </section>
          </div>
        </div>

        <footer className="flex flex-col gap-2 px-2 py-4 text-sm font-semibold text-[#49645f] sm:flex-row sm:items-center sm:justify-between">
          <span>Backend API: FastAPI, PostgreSQL, Supabase Storage</span>
          <span>JWT cookies, signed uploads, role-based sharing</span>
        </footer>
      </div>
    </main>
  );
}

function getNavClass(active: boolean) {
  if (active) {
    return "rounded-full bg-[linear-gradient(135deg,#123632_0%,#1c6a61_72%,#8ac7b0_160%)] px-6 py-4 text-[#f6fbf8] shadow-md shadow-[#092c28]/20 transition hover:-translate-y-0.5";
  }

  return "rounded-full border border-[#cce0d7] bg-[#f6fbf8]/82 px-6 py-4 text-[#49645f] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-[#1c6a61]";
}

function HomeHero({ onNavigate }: { onNavigate: (page: PublicPage) => void }) {
  return (
    <section className="min-w-0">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#c9d0b6] bg-[#fffdf7]/85 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#344e41] shadow-sm backdrop-blur">
        <ShieldCheck size={15} aria-hidden="true" />
        Secure drive workspace
      </div>

      <div className="mt-6 max-w-3xl">
        <h2 className="text-5xl font-black leading-[0.96] text-[#122622] sm:text-7xl lg:text-8xl">
          Manage every media file from one workspace.
        </h2>
        <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#49645f] sm:text-lg">
          Upload media, organize folders, search files, share access, and recover deleted items from a secure
          FastAPI and React workspace.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0f2b28] px-6 text-sm font-extrabold text-[#f6fbf8] shadow-lg shadow-[#092c28]/25 transition hover:-translate-y-0.5 hover:bg-[#1c6a61]"
          type="button"
          onClick={() => onNavigate("register")}
        >
          Create account
          <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button
          className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#cce0d7] bg-[#f6fbf8]/88 px-6 text-sm font-extrabold text-[#1c6a61] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
          type="button"
          onClick={() => onNavigate("login")}
        >
          Login
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3" id="features">
        <Feature icon={<UploadCloud size={19} />} label="Direct uploads" value="100 MB" />
        <Feature icon={<FolderKey size={19} />} label="Folder access" value="RBAC" />
        <Feature icon={<FileSearch size={19} />} label="Search filters" value="Fast" />
      </div>

      <ProductPreview />
    </section>
  );
}

function AuthHero({ page }: { page: Exclude<PublicPage, "home"> }) {
  const isLogin = page === "login";

  return (
    <section className="min-w-0">
      <p className="text-sm font-extrabold uppercase tracking-[0.26em] text-[#1c6a61]">Secure access</p>
      <h2 className="mt-6 max-w-3xl text-5xl font-black leading-[0.96] text-[#122622] sm:text-7xl">
        {isLogin ? "Sign in to your account." : "Create your account."}
      </h2>
      <p className="mt-6 max-w-2xl text-xl font-medium leading-9 text-[#49645f]">
        {isLogin
          ? "Use your email and password to open the correct storage workspace."
          : "Create a new account to start uploading, organizing, and sharing files."}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <span className="rounded-full bg-[#0f2b28] px-5 py-3 text-sm font-extrabold text-[#f6fbf8]">
          No active session
        </span>
        <span className="rounded-full bg-[#d5ebe2] px-5 py-3 text-sm font-extrabold text-[#1c6a61]">
          Welcome to CloudDrive
        </span>
      </div>

      <div className="mt-7 grid max-w-2xl gap-4">
        <AuthInfoCard title="Fast setup" copy="Use the same auth contract for registration and login." />
        <AuthInfoCard title="Role sharing" copy="Viewer and editor access keeps files controlled." />
        <AuthInfoCard title="Audit ready" copy="Uploads, folders, shares, search, and trash stay connected." />
      </div>
    </section>
  );
}

function AuthInfoCard({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-[22px] border border-white/80 bg-white/78 px-6 py-5 shadow-md shadow-[#092c28]/10">
      <h3 className="text-lg font-black text-[#122622]">{title}</h3>
      <p className="mt-2 text-base font-medium leading-7 text-[#49645f]">{copy}</p>
    </article>
  );
}

function Feature({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-lg border border-[#e5e0d2] bg-[#fffdf7]/88 px-4 py-3 shadow-md shadow-[#344e41]/10 backdrop-blur">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7eadc] text-[#344e41]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-[#7f8b63]">{value}</span>
        <span className="block text-sm font-extrabold text-[#344e41]">{label}</span>
      </span>
    </div>
  );
}

function ProductPreview() {
  return (
    <div
      className="mt-8 overflow-hidden rounded-lg border border-[#e5e0d2] bg-[#fffdf7]/82 shadow-soft backdrop-blur-xl"
      id="security"
    >
      <div className="flex items-center justify-between border-b border-[#d7d1c1] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#b46a55]" />
          <span className="h-3 w-3 rounded-full bg-[#a3b18a]" />
          <span className="h-3 w-3 rounded-full bg-[#344e41]" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7b826c]">Drive preview</span>
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
          <div className="grid gap-2 rounded-lg bg-[#e7eadc] p-3">
            {["Project-media.zip", "Brand-assets", "Client-demo.mp4"].map((name, index) => (
              <div className="flex items-center justify-between rounded-lg bg-[#fffdf7] px-3 py-3 shadow-sm" key={name}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-9 w-9 rounded-lg bg-[#a3b18a]" />
                  <span className="truncate text-sm font-extrabold text-[#344e41]">{name}</span>
                </div>
                <span className="text-xs font-bold text-[#7b826c]">{index === 0 ? "12 MB" : "Folder"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeAccessPreview({ onNavigate }: { onNavigate: (page: PublicPage) => void }) {
  return (
    <div className="w-full rounded-lg border border-[#e5e0d2] bg-[#fffdf7]/86 p-5 shadow-soft backdrop-blur-xl sm:p-6">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#7f8b63]">Workspace access</p>
      <h2 className="mt-2 text-3xl font-black text-[#18201b]">Ready for your files</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#5d6857]">
        Open the secure login page or create a new account before entering the storage dashboard.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="flex h-12 items-center justify-center rounded-lg border border-[#d7d1c1] bg-[#fffdf7] text-sm font-extrabold text-[#344e41] shadow-sm hover:bg-white"
          type="button"
          onClick={() => onNavigate("login")}
        >
          Login
        </button>
        <button
          className="flex h-12 items-center justify-center rounded-lg bg-[#344e41] text-sm font-extrabold text-[#fffdf7] shadow-lg shadow-[#344e41]/20 hover:bg-[#263a31]"
          type="button"
          onClick={() => onNavigate("register")}
        >
          Register
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <PreviewMetric label="Protected routes" value="JWT" />
        <PreviewMetric label="Storage provider" value="Supabase" />
        <PreviewMetric label="Sharing roles" value="Viewer / Editor" />
      </div>
    </div>
  );
}

function PreviewNav({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-extrabold ${
        active ? "bg-[#344e41] text-[#fffdf7]" : "bg-[#eeece2] text-[#5d6857]"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d7d1c1] bg-[#fffdf7] px-3 py-3 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7f8b63]">{label}</span>
      <strong className="mt-1 block text-lg font-black text-[#18201b]">{value}</strong>
    </div>
  );
}
