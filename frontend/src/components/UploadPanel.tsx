import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, FileText, Image, Loader2, UploadCloud, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage } from "../services/api";
import { completeUpload, initUpload, uploadToSignedUrl } from "../services/drive";

type UploadPanelProps = {
  folderId: string | null;
};

type UploadState = "idle" | "uploading" | "completed" | "failed";

const acceptedMimeTypes = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/gif": [],
  "application/pdf": [],
  "video/mp4": [],
  "audio/mpeg": [],
  "text/plain": [],
  "application/zip": [],
};
const maxUploadSizeBytes = 100 * 1024 * 1024;

export function UploadPanel({ folderId }: UploadPanelProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const previewType = useMemo(() => {
    if (!selectedFile) {
      return "none";
    }
    if (selectedFile.type.startsWith("image/")) {
      return "image";
    }
    if (selectedFile.type === "application/pdf") {
      return "pdf";
    }
    return "file";
  }, [selectedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptedMimeTypes,
    maxSize: maxUploadSizeBytes,
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProgress(0);
      setState("idle");
      setError(null);
    },
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      const reason = rejection?.errors[0]?.message ?? "File cannot be uploaded.";
      setError(reason);
      setSelectedFile(null);
      setPreviewUrl(null);
      setProgress(0);
      setState("failed");
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setState("uploading");
    setError(null);
    setProgress(0);

    try {
      const upload = await initUpload({
        name: selectedFile.name,
        mime_type: selectedFile.type || "application/octet-stream",
        size_bytes: selectedFile.size,
        folder_id: folderId,
      });
      await uploadToSignedUrl(upload.upload_url, selectedFile, setProgress);
      await completeUpload(upload.file_id);
      setProgress(100);
      setState("completed");
      await queryClient.invalidateQueries({ queryKey: ["drive-items", folderId] });
    } catch (uploadError) {
      setState("failed");
      setError(getApiErrorMessage(uploadError));
    }
  }

  function clearSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setState("idle");
    setError(null);
  }

  return (
    <section className="mt-5 rounded-lg border border-line bg-white p-4 shadow-sm">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-7 text-center transition ${
          isDragActive ? "border-brand bg-blue-50" : "border-line bg-panel hover:border-blue-300"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="text-brand" size={30} aria-hidden="true" />
        <h2 className="mt-3 text-sm font-semibold text-ink">Drop a file here or browse</h2>
        <p className="mt-1 text-xs text-slate-500">Images, PDFs, video, audio, text, and zip files up to 100 MB</p>
      </div>

      {selectedFile ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <Preview previewUrl={previewUrl} previewType={previewType} fileName={selectedFile.name} />
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedFile.type || "Unknown type"}</p>
              </div>
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                type="button"
                aria-label="Clear selected file"
                title="Clear selected file"
                onClick={clearSelection}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{state === "completed" ? "Upload complete" : "Upload progress"}</span>
              <span>{progress}%</span>
            </div>

            {error ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                <AlertCircle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="button"
              onClick={() => void handleUpload()}
              disabled={state === "uploading" || state === "completed"}
            >
              {state === "uploading" ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : null}
              {state === "completed" ? "Uploaded" : "Upload file"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Preview({
  previewUrl,
  previewType,
  fileName,
}: {
  previewUrl: string | null;
  previewType: "none" | "image" | "pdf" | "file";
  fileName: string;
}) {
  if (previewType === "image" && previewUrl) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-line bg-slate-100">
        <img className="h-full w-full object-cover" src={previewUrl} alt={fileName} />
      </div>
    );
  }

  if (previewType === "pdf" && previewUrl) {
    return (
      <iframe
        className="aspect-[4/3] w-full rounded-lg border border-line bg-slate-100"
        src={previewUrl}
        title={fileName}
      />
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-line bg-slate-100 text-brand">
      {previewType === "file" ? <FileText size={42} aria-hidden="true" /> : <Image size={42} aria-hidden="true" />}
    </div>
  );
}
