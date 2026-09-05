import { FormEvent, useMemo, useState } from "react";
import { Download, Eye, FileText, Folder, Loader2, LockKeyhole } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { getApiErrorMessage } from "../services/api";
import { accessPublicLink } from "../services/sharing";
import type { PublicLinkAccessResponse } from "../services/sharing";

type PublicLinkPageProps = {
  token: string;
};

export function PublicLinkPage({ token }: PublicLinkPageProps) {
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState<PublicLinkAccessResponse | null>(null);
  const access = useMutation({
    mutationFn: () => accessPublicLink(token, password),
    onSuccess: (response) => setPreview(response),
  });
  const title = preview?.file?.name ?? preview?.folder?.name ?? "Shared item";
  const downloadUrl = preview?.download?.download_url;
  const canPreview = useMemo(() => {
    const mimeType = preview?.file?.mime_type ?? "";
    return mimeType.startsWith("image/") || mimeType === "application/pdf";
  }, [preview]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    access.mutate();
  }

  return (
    <main className="min-h-dvh bg-[#d8ebe2] p-4 text-ink sm:p-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-5xl flex-col rounded-[34px] border border-white/70 bg-[#eef7f3]/68 p-5 shadow-[0_30px_80px_rgba(9,44,40,0.14)] backdrop-blur-xl sm:p-8">
        <header className="flex items-center gap-4 border-b border-white/70 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_62%,#8ac7b0_150%)] text-[#f6fbf8] shadow-lg shadow-[#092c28]/25">
            <LockKeyhole size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#6e827c]">Public access</p>
            <h1 className="mt-1 text-2xl font-black text-ink">CloudDrive shared link</h1>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[360px_1fr]">
          <form className="h-fit rounded-[28px] border border-white/75 bg-white/72 p-5 shadow-soft" onSubmit={handleSubmit}>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6e827c]">Open shared item</p>
            <p className="mt-3 text-base font-semibold leading-7 text-[#49645f]">
              Enter the link password if one was set, then open the shared file.
            </p>
            <label className="mt-5 block text-sm font-extrabold text-ink" htmlFor="public-link-password">
              Password
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-semibold outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
                id="public-link-password"
                type="password"
                value={password}
                maxLength={72}
                placeholder="Optional password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {access.error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {getApiErrorMessage(access.error)}
              </div>
            ) : null}
            <button
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_74%,#62aa98_150%)] px-5 text-sm font-extrabold text-[#f6fbf8] shadow-md shadow-[#092c28]/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
              type="submit"
              disabled={access.isPending}
            >
              {access.isPending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : null}
              Open link
            </button>
          </form>

          <section className="min-h-[420px] rounded-[28px] border border-white/75 bg-white/62 p-5 shadow-soft">
            {preview ? (
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff0e8] text-brand">
                      {preview.file ? <FileText size={20} aria-hidden="true" /> : <Folder size={20} aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black text-ink">{title}</h2>
                      <p className="mt-1 text-sm font-semibold text-[#6e827c]">
                        {preview.file ? `${preview.file.mime_type} · ${formatBytes(preview.file.size_bytes)}` : "Shared folder"}
                      </p>
                    </div>
                  </div>
                  {downloadUrl ? (
                    <a
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-[#49645f] shadow-sm transition hover:-translate-y-0.5 hover:text-brand"
                      href={downloadUrl}
                    >
                      <Download size={16} aria-hidden="true" />
                      Download
                    </a>
                  ) : null}
                </div>

                <div className="mt-5 flex min-h-0 flex-1 items-center justify-center rounded-[24px] border border-dashed border-[#a8c4bb] bg-[#eef7f3]/72">
                  {downloadUrl && canPreview ? (
                    preview.file?.mime_type.startsWith("image/") ? (
                      <img className="max-h-[560px] max-w-full rounded-2xl object-contain" src={downloadUrl} alt={title} />
                    ) : (
                      <iframe className="h-[560px] w-full rounded-2xl border-0" src={downloadUrl} title={title} />
                    )
                  ) : preview.folder ? (
                    <div className="w-full self-start p-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_104px] border-b border-white/70 pb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6e827c]">
                        <span>Name</span>
                        <span>Type</span>
                        <span>Updated</span>
                        <span />
                      </div>
                      {[...preview.folders, ...preview.files].length === 0 ? (
                        <div className="py-16 text-center">
                          <Folder className="mx-auto text-[#8aa39b]" size={42} aria-hidden="true" />
                          <p className="mt-3 text-lg font-black text-ink">This folder is empty</p>
                        </div>
                      ) : (
                        <div>
                          {preview.folders.map((folderItem) => (
                            <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_104px] items-center border-b border-white/60 py-4" key={`folder-${folderItem.id}`}>
                              <span className="truncate text-sm font-extrabold text-ink">{folderItem.name}</span>
                              <span className="text-sm font-semibold text-[#6e827c]">Folder</span>
                              <span className="text-sm font-semibold text-[#6e827c]">{formatDate(folderItem.updated_at)}</span>
                              <span />
                            </div>
                          ))}
                          {preview.files.map((entry) => (
                            <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_104px] items-center border-b border-white/60 py-4" key={`file-${entry.file.id}`}>
                              <span className="truncate text-sm font-extrabold text-ink">{entry.file.name}</span>
                              <span className="truncate text-sm font-semibold text-[#6e827c]">{entry.file.mime_type}</span>
                              <span className="text-sm font-semibold text-[#6e827c]">{formatDate(entry.file.updated_at)}</span>
                              <span className="flex justify-end gap-1">
                                <a
                                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6e827c] transition hover:bg-white hover:text-brand"
                                  href={entry.download.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Open ${entry.file.name}`}
                                  aria-label={`Open ${entry.file.name}`}
                                >
                                  <Eye size={16} aria-hidden="true" />
                                </a>
                                <a
                                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6e827c] transition hover:bg-white hover:text-brand"
                                  href={entry.download.download_url}
                                  title={`Download ${entry.file.name}`}
                                  aria-label={`Download ${entry.file.name}`}
                                >
                                  <Download size={16} aria-hidden="true" />
                                </a>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 text-center">
                      <FileText className="mx-auto text-[#8aa39b]" size={42} aria-hidden="true" />
                      <p className="mt-3 text-lg font-black text-ink">
                        Preview is not available for this file type
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                <div>
                  <LockKeyhole className="mx-auto text-[#8aa39b]" size={44} aria-hidden="true" />
                  <p className="mt-4 text-xl font-black text-ink">Shared content is locked</p>
                  <p className="mt-2 text-sm font-semibold text-[#6e827c]">Open the link to load the shared file details.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
