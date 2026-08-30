import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  Grid2X2,
  HardDrive,
  List,
  Loader2,
  LogOut,
  Search,
  Share2,
  Trash2,
  UserCircle,
} from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { buildBreadcrumbs, useDriveItems, useFolderDetail } from "../hooks/useDrive";
import type { FileItem, Folder as FolderItem } from "../services/drive";
import { ShareModal } from "../components/ShareModal";
import type { ShareTarget } from "../services/sharing";
import { UploadPanel } from "../components/UploadPanel";

type ViewMode = "list" | "grid";
type SectionKey = "my-drive" | "shared" | "trash";

export function DashboardPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("my-drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const folderDetail = useFolderDetail(currentFolderId);
  const driveItems = useDriveItems(activeSection === "my-drive" ? currentFolderId : null);
  const breadcrumbs = buildBreadcrumbs(currentFolderId, folderDetail.data?.breadcrumbs);
  const itemCount = (driveItems.data?.folders.length ?? 0) + (driveItems.data?.files.length ?? 0);

  function openSection(section: SectionKey) {
    setActiveSection(section);
    setCurrentFolderId(null);
  }

  return (
    <main className="min-h-screen bg-[#eef2f7] text-ink">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-white px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
              <HardDrive size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Cloud Storage</p>
              <p className="text-xs text-slate-500">Drive workspace</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <SidebarItem
              icon={<HardDrive size={18} />}
              label="My Drive"
              active={activeSection === "my-drive"}
              onClick={() => openSection("my-drive")}
            />
            <SidebarItem
              icon={<Share2 size={18} />}
              label="Shared"
              active={activeSection === "shared"}
              onClick={() => openSection("shared")}
            />
            <SidebarItem
              icon={<Trash2 size={18} />}
              label="Trash"
              active={activeSection === "trash"}
              onClick={() => openSection("trash")}
            />
          </nav>

          <div className="mt-6 rounded-lg border border-line bg-panel p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <UserCircle size={18} aria-hidden="true" />
              <span className="truncate">{user?.full_name || user?.email}</span>
            </div>
            <button
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6">
          <header className="flex flex-col gap-4 border-b border-line pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <Breadcrumbs
                items={breadcrumbs}
                onSelect={(folderId) => {
                  setActiveSection("my-drive");
                  setCurrentFolderId(folderId);
                }}
              />
              <h1 className="mt-3 text-2xl font-semibold text-ink">{getSectionTitle(activeSection)}</h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-line bg-white px-3 text-slate-500 shadow-sm sm:w-72">
                <Search size={17} aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  placeholder="Search files"
                  type="search"
                  disabled
                />
              </div>
              <div className="flex h-10 w-fit rounded-lg border border-line bg-white p-1 shadow-sm">
                <IconToggle
                  active={viewMode === "list"}
                  label="List view"
                  onClick={() => setViewMode("list")}
                  icon={<List size={17} />}
                />
                <IconToggle
                  active={viewMode === "grid"}
                  label="Grid view"
                  onClick={() => setViewMode("grid")}
                  icon={<Grid2X2 size={17} />}
                />
              </div>
            </div>
          </header>

          {activeSection === "my-drive" ? (
            <>
              <UploadPanel folderId={currentFolderId} />
              <DriveContent
                folders={driveItems.data?.folders ?? []}
                files={driveItems.data?.files ?? []}
                isLoading={driveItems.isLoading || folderDetail.isLoading}
                error={driveItems.error ?? folderDetail.error}
                itemCount={itemCount}
                viewMode={viewMode}
                onOpenFolder={setCurrentFolderId}
                onShare={setShareTarget}
              />
            </>
          ) : (
            <SectionPlaceholder section={activeSection} />
          )}
        </section>
      </div>
      {shareTarget ? <ShareModal target={shareTarget} onClose={() => setShareTarget(null)} /> : null}
    </main>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
        active ? "bg-blue-50 text-brand" : "text-slate-600 hover:bg-slate-50"
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function Breadcrumbs({
  items,
  onSelect,
}: {
  items: readonly { id: string | null; name: string }[];
  onSelect: (folderId: string | null) => void;
}) {
  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div className="flex min-w-0 items-center gap-1" key={`${item.id ?? "root"}-${index}`}>
          {index > 0 ? <ChevronRight size={15} aria-hidden="true" /> : null}
          <button
            className="max-w-48 truncate rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-white hover:text-brand"
            type="button"
            onClick={() => onSelect(item.id)}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  );
}

function DriveContent({
  folders,
  files,
  isLoading,
  error,
  itemCount,
  viewMode,
  onOpenFolder,
  onShare,
}: {
  folders: FolderItem[];
  files: FileItem[];
  isLoading: boolean;
  error: unknown;
  itemCount: number;
  viewMode: ViewMode;
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-brand" size={20} aria-hidden="true" />
          <span className="text-sm font-medium">Loading drive</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {getApiErrorMessage(error)}
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white">
        <div className="text-center">
          <Folder className="mx-auto text-slate-300" size={38} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-700">No files or folders</h2>
        </div>
      </div>
    );
  }

  return viewMode === "grid" ? (
    <GridView folders={folders} files={files} onOpenFolder={onOpenFolder} onShare={onShare} />
  ) : (
    <ListView folders={folders} files={files} onOpenFolder={onOpenFolder} onShare={onShare} />
  );
}

function ListView({
  folders,
  files,
  onOpenFolder,
  onShare,
}: {
  folders: FolderItem[];
  files: FileItem[];
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="grid grid-cols-[1fr_120px_150px_52px] border-b border-line bg-panel px-4 py-3 text-xs font-semibold uppercase text-slate-500">
        <span>Name</span>
        <span>Type</span>
        <span>Updated</span>
        <span />
      </div>
      {folders.map((folder) => (
        <div
          className="grid h-14 grid-cols-[1fr_120px_150px_52px] items-center border-b border-line px-4 transition hover:bg-blue-50"
          key={folder.id}
        >
          <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(folder.id)}>
            <ItemName icon={<Folder size={19} />} name={folder.name} />
          </button>
          <span className="text-sm text-slate-500">Folder</span>
          <span className="text-sm text-slate-500">{formatDate(folder.updated_at)}</span>
          <ShareAction
            onClick={() => onShare({ id: folder.id, type: "folder", name: folder.name })}
            label={`Share ${folder.name}`}
          />
        </div>
      ))}
      {files.map((file) => (
        <div className="grid h-14 grid-cols-[1fr_120px_150px_52px] items-center border-b border-line px-4" key={file.id}>
          <ItemName icon={<FileText size={19} />} name={file.name} />
          <span className="truncate text-sm text-slate-500">{file.mime_type}</span>
          <span className="text-sm text-slate-500">{formatBytes(file.size_bytes)}</span>
          <ShareAction onClick={() => onShare({ id: file.id, type: "file", name: file.name })} label={`Share ${file.name}`} />
        </div>
      ))}
    </div>
  );
}

function GridView({
  folders,
  files,
  onOpenFolder,
  onShare,
}: {
  folders: FolderItem[];
  files: FileItem[];
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
}) {
  const items = useMemo(
    () => [
      ...folders.map((folder) => ({ ...folder, kind: "folder" as const })),
      ...files.map((file) => ({ ...file, kind: "file" as const })),
    ],
    [folders, files],
  );

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) =>
        item.kind === "folder" ? (
          <div
            className="min-h-28 rounded-lg border border-line bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(item.id)}>
                <ItemName icon={<Folder size={21} />} name={item.name} />
              </button>
              <ShareAction
                onClick={() => onShare({ id: item.id, type: "folder", name: item.name })}
                label={`Share ${item.name}`}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">Folder</p>
          </div>
        ) : (
          <div className="min-h-28 rounded-lg border border-line bg-white p-4 shadow-sm" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <ItemName icon={<FileText size={21} />} name={item.name} />
              <ShareAction
                onClick={() => onShare({ id: item.id, type: "file", name: item.name })}
                label={`Share ${item.name}`}
              />
            </div>
            <p className="mt-3 truncate text-sm text-slate-500">{item.mime_type}</p>
            <p className="mt-1 text-sm text-slate-500">{formatBytes(item.size_bytes)}</p>
          </div>
        ),
      )}
    </div>
  );
}

function ItemName({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="truncate text-sm font-semibold text-ink">{name}</span>
    </div>
  );
}

function IconToggle({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
        active ? "bg-brand text-white" : "text-slate-500 hover:bg-slate-50"
      }`}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function ShareAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-brand"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Share2 size={16} aria-hidden="true" />
    </button>
  );
}

function SectionPlaceholder({ section }: { section: Exclude<SectionKey, "my-drive"> }) {
  const label = section === "shared" ? "Shared" : "Trash";
  const Icon = section === "shared" ? Share2 : Trash2;

  return (
    <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white">
      <div className="text-center">
        <Icon className="mx-auto text-slate-300" size={38} aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-slate-700">{label}</h2>
      </div>
    </div>
  );
}

function getSectionTitle(section: SectionKey) {
  if (section === "shared") {
    return "Shared";
  }
  if (section === "trash") {
    return "Trash";
  }
  return "My Drive";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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
