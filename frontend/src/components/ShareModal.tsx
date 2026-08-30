import { FormEvent, useState } from "react";
import { Copy, Link, Loader2, Mail, Shield, Trash2, X } from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { buildPublicLinkUrl, type ShareRole, type ShareTarget } from "../services/sharing";
import { useCreatePublicLink, useCreateShare, useDeleteShare, useShares } from "../hooks/useSharing";

type ShareModalProps = {
  target: ShareTarget;
  onClose: () => void;
};

export function ShareModal({ target, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [shareRole, setShareRole] = useState<ShareRole>("viewer");
  const [linkRole, setLinkRole] = useState<ShareRole>("viewer");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shares = useShares(target);
  const createShare = useCreateShare(target);
  const deleteShare = useDeleteShare(target);
  const createPublicLink = useCreatePublicLink(target);
  const error = createShare.error ?? createPublicLink.error ?? deleteShare.error ?? shares.error;

  async function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createShare.mutateAsync({ shared_with_email: email, role: shareRole });
    setEmail("");
  }

  async function handleCreateLink() {
    const response = await createPublicLink.mutateAsync({
      role: linkRole,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      password: password || undefined,
    });
    setPublicLink(buildPublicLinkUrl(response.public_path));
    setCopied(false);
  }

  async function copyLink() {
    if (!publicLink) {
      return;
    }
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-soft">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share {target.type}</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-ink">{target.name}</h2>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            type="button"
            aria-label="Close share modal"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-5 p-5">
          <form className="rounded-lg border border-line p-4" onSubmit={(event) => void handleShare(event)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Mail size={17} aria-hidden="true" />
              Share with user
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px]">
              <input
                className="h-10 min-w-0 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
                type="email"
                value={email}
                placeholder="teammate@example.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <RoleSelect value={shareRole} onChange={setShareRole} />
            </div>
            <button
              className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={createShare.isPending}
            >
              {createShare.isPending ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : null}
              Share
            </button>
          </form>

          <section className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Link size={17} aria-hidden="true" />
              Public link
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[130px_1fr_1fr]">
              <RoleSelect value={linkRole} onChange={setLinkRole} />
              <input
                className="h-10 min-w-0 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              <input
                className="h-10 min-w-0 rounded-lg border border-line px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
                type="password"
                value={password}
                maxLength={72}
                placeholder="Optional password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button
              className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              type="button"
              disabled={createPublicLink.isPending}
              onClick={() => void handleCreateLink()}
            >
              {createPublicLink.isPending ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : null}
              Generate link
            </button>

            {publicLink ? (
              <div className="mt-3 flex flex-col gap-2 rounded-lg bg-panel p-3 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{publicLink}</span>
                <button
                  className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  type="button"
                  onClick={() => void copyLink()}
                >
                  <Copy size={15} aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-line p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Shield size={17} aria-hidden="true" />
              Shared users
            </div>

            {shares.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                Loading shares
              </div>
            ) : null}

            {!shares.isLoading && shares.data?.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No users have access yet.</p>
            ) : null}

            <div className="mt-3 space-y-2">
              {shares.data?.map((share) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-panel px-3 py-2" key={share.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {share.shared_with_email || share.shared_with_user_id}
                    </p>
                    <p className="text-xs capitalize text-slate-500">{share.role}</p>
                  </div>
                  <button
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-red-600"
                    type="button"
                    aria-label="Remove share"
                    title="Remove share"
                    onClick={() => deleteShare.mutate(share.id)}
                    disabled={deleteShare.isPending}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {getApiErrorMessage(error)}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: ShareRole; onChange: (value: ShareRole) => void }) {
  return (
    <select
      className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
      value={value}
      onChange={(event) => onChange(event.target.value as ShareRole)}
    >
      <option value="viewer">Viewer</option>
      <option value="editor">Editor</option>
    </select>
  );
}
