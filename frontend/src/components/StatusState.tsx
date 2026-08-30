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
        className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-sm"
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

export function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white px-4">
      <div className="text-center">
        <span className="mx-auto flex justify-center text-slate-300">{icon}</span>
        <h2 className="mt-3 text-lg font-semibold text-slate-700">{title}</h2>
      </div>
    </div>
  );
}
