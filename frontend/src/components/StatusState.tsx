import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

type StatusStateProps = {
  children: ReactNode;
};

export function StatusFrame({ children }: StatusStateProps) {
  return <div className="flex min-h-[360px] items-center justify-center">{children}</div>;
}

export function LoadingState({ label }: { label: string }) {
  return (
    <StatusFrame>
      <div
        className="flex items-center gap-3 rounded-2xl border border-white/75 bg-white/78 px-5 py-4 shadow-md shadow-[#092c28]/10"
        aria-live="polite"
      >
        <Loader2 className="animate-spin text-brand" size={20} aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </StatusFrame>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      <AlertCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-[#a8c4bb] bg-white/62 px-4 shadow-inner">
      <div className="text-center">
        <span className="mx-auto flex justify-center text-[#9bb7ad]">{icon}</span>
        <h2 className="mt-3 text-xl font-black text-ink">{title}</h2>
        {description ? <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#6e827c]">{description}</p> : null}
      </div>
    </div>
  );
}
