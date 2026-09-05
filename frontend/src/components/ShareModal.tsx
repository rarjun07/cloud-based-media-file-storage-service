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
    try {
      await createShare.mutateAsync({ shared_with_email: email, role: shareRole });
      setEmail("");
    } catch {
      return;
    }
  }

  async function handleCreateLink() {
    try {
      const response = await createPublicLink.mutateAsync({
        role: "viewer",
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        password: password || undefined,
      });
      setPublicLink(buildPublicLinkUrl(response.public_path));
      setCopied(false);
    } catch {
      return;
    }
  }

  async function copyLink() {
    if (!publicLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092c28]/42 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/75 bg-[#eef7f3]/92 shadow-soft backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">Share {target.type}</p>
            <h2 className="mt-1 truncate text-2xl font-black text-ink">{target.name}</h2>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6e827c] hover:bg-white hover:text-brand"
            type="button"
            aria-label="Close share modal"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-5 p-6">
          <form className="rounded-[24px] border border-white/75 bg-white/62 p-5 shadow-sm" onSubmit={(event) => void handleShare(event)}>
            <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <Mail size={17} aria-hidden="true" />
              Share with user
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px]">
              <input
                className="h-12 min-w-0 rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
                type="email"
                value={email}
                placeholder="teammate@example.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <RoleSelect value={shareRole} onChange={setShareRole} />
            </div>
            <button
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_74%,#62aa98_150%)] px-5 text-sm font-extrabold text-[#f6fbf8] shadow-md shadow-[#092c28]/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#8ac7b0]"
              type="submit"
              disabled={createShare.isPending}
            >
              {createShare.isPending ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : null}
              Share
            </button>
          </form>

          <section className="rounded-[24px] border border-white/75 bg-white/62 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <Link size={17} aria-hidden="true" />
              Public link
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[130px_1fr_1fr]">
              <div className="flex h-12 items-center rounded-2xl border border-[#c8dcd5] bg-[#dff0e8] px-4 text-sm font-extrabold text-brand">
                Viewer
              </div>
              <input
                className="h-12 min-w-0 rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              <input
                className="h-12 min-w-0 rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
                type="password"
                value={password}
                maxLength={72}
                placeholder="Optional password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#c8dcd5] bg-white/72 px-5 text-sm font-extrabold text-[#49645f] transition hover:-translate-y-0.5 hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:bg-[#d5ebe2]"
              type="button"
              disabled={createPublicLink.isPending}
              onClick={() => void handleCreateLink()}
            >
              {createPublicLink.isPending ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : null}
              Generate link
            </button>

            {publicLink ? (
              <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#dff0e8]/86 p-3 sm:flex-row sm:items-center">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#49645f]">{publicLink}</span>
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-extrabold text-[#49645f] shadow-sm hover:text-brand"
                  type="button"
                  onClick={() => void copyLink()}
                >
                  <Copy size={15} aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[24px] border border-white/75 bg-white/62 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <Shield size={17} aria-hidden="true" />
              Shared users
            </div>

            {shares.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#6e827c]">
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                Loading shares
              </div>
            ) : null}

            {!shares.isLoading && shares.data?.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-[#6e827c]">No users have access yet.</p>
            ) : null}

            <div className="mt-3 space-y-2">
              {shares.data?.map((share) => (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#dff0e8]/86 px-4 py-3" key={share.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {share.shared_with_email || share.shared_with_user_id}
                    </p>
                    <p className="text-xs font-bold capitalize text-[#6e827c]">{share.role}</p>
                  </div>
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6e827c] hover:bg-white hover:text-red-600"
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
      className="h-12 rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-extrabold text-[#49645f] outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
      value={value}
      onChange={(event) => onChange(event.target.value as ShareRole)}
    >
      <option value="viewer">Viewer</option>
      <option value="editor">Editor</option>
    </select>
  );
}
