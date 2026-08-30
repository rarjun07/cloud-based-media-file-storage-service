import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  ChevronRight,
  FileText,
  Folder,
  Grid2X2,
  HardDrive,
  List,
  Loader2,
  LogOut,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  UserCircle,
} from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { buildBreadcrumbs, useDriveItems, useFolderDetail } from "../hooks/useDrive";
import { useSearchItems } from "../hooks/useSearch";
import { usePermanentDeleteTrashItem, useRestoreTrashItem, useTrash } from "../hooks/useTrash";
import type { FileItem, Folder as FolderItem } from "../services/drive";
import { ShareModal } from "../components/ShareModal";
import type { ShareTarget } from "../services/sharing";
import type { TrashTarget } from "../services/trash";
import { UploadPanel } from "../components/UploadPanel";

type ViewMode = "list" | "grid";
type SectionKey = "my-drive" | "shared" | "trash";
type SortBy = "name" | "updated" | "size";
type SortDirection = "asc" | "desc";
type BrowserItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string;
};
type TrashItem = BrowserItem & {
  deletedAt: string | null;
};

const PAGE_SIZE = 12;

export function DashboardPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("my-drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const folderDetail = useFolderDetail(currentFolderId);
  const driveItems = useDriveItems(activeSection === "my-drive" ? currentFolderId : null);
  const searchItems = useSearchItems(searchQuery, mimeType);
  const trash = useTrash();
  const restoreTrashItem = useRestoreTrashItem();
  const permanentDeleteTrashItem = usePermanentDeleteTrashItem();
  const breadcrumbs = buildBreadcrumbs(currentFolderId, folderDetail.data?.breadcrumbs);
  const isSearchMode = Boolean(searchQuery.trim() || mimeType.trim());
  const items = useMemo(() => {
    const baseItems = isSearchMode
      ? normalizeSearchItems(searchItems.data?.results ?? [])
      : normalizeDriveItems(driveItems.data?.folders ?? [], driveItems.data?.files ?? []);
    return sortItems(baseItems, sortBy, sortDirection);
  }, [driveItems.data, isSearchMode, searchItems.data, sortBy, sortDirection]);
  const trashItems = useMemo(
    () => normalizeTrashItems(trash.data?.folders ?? [], trash.data?.files ?? []),
    [trash.data],
  );
  const visibleItems = items.slice(0, visibleCount);
  const isLoading = isSearchMode ? searchItems.isLoading : driveItems.isLoading || folderDetail.isLoading;
  const error = isSearchMode ? searchItems.error : driveItems.error ?? folderDetail.error;
  const pendingTrashAction =
    restoreTrashItem.isPending && restoreTrashItem.variables
      ? `restore-${restoreTrashItem.variables.type}-${restoreTrashItem.variables.id}`
      : permanentDeleteTrashItem.isPending && permanentDeleteTrashItem.variables
        ? `delete-${permanentDeleteTrashItem.variables.type}-${permanentDeleteTrashItem.variables.id}`
        : null;

  function openSection(section: SectionKey) {
    setActiveSection(section);
    setCurrentFolderId(null);
    setVisibleCount(PAGE_SIZE);
  }

  function openFolder(folderId: string) {
    setSearchQuery("");
    setMimeType("");
    setCurrentFolderId(folderId);
    setVisibleCount(PAGE_SIZE);
  }

  function handlePermanentDelete(target: TrashTarget, name: string) {
    if (window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
      permanentDeleteTrashItem.mutate(target);
    }
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
          <header className="flex flex-col gap-4 border-b border-line pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <Breadcrumbs
                  items={breadcrumbs}
                  onSelect={(folderId) => {
                    setActiveSection("my-drive");
                    setCurrentFolderId(folderId);
                    setSearchQuery("");
                    setMimeType("");
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
                <h1 className="mt-3 text-2xl font-semibold text-ink">
                  {isSearchMode ? "Search Results" : getSectionTitle(activeSection)}
                </h1>
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

            <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_190px_190px_44px]">
              <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-line bg-white px-3 text-slate-500 shadow-sm">
                <Search size={17} aria-hidden="true" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  placeholder="Search files and folders"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setActiveSection("my-drive");
                    setSearchQuery(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
              </div>
              <select
                className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
                value={mimeType}
                onChange={(event) => {
                  setActiveSection("my-drive");
                  setMimeType(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="">All file types</option>
                <option value="image/png">PNG images</option>
                <option value="image/jpeg">JPEG images</option>
                <option value="application/pdf">PDF documents</option>
                <option value="video/mp4">MP4 video</option>
                <option value="audio/mpeg">MP3 audio</option>
                <option value="text/plain">Text files</option>
                <option value="application/zip">Zip archives</option>
              </select>
              <select
                className="h-10 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-blue-100"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as SortBy);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                <option value="updated">Sort by updated</option>
                <option value="name">Sort by name</option>
                <option value="size">Sort by size</option>
              </select>
              <IconToggle
                active
                label={sortDirection === "asc" ? "Ascending" : "Descending"}
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                icon={getSortIcon(sortBy, sortDirection)}
              />
            </div>
          </header>

          {activeSection === "my-drive" ? (
            <>
              {!isSearchMode ? <UploadPanel folderId={currentFolderId} /> : null}
              <DriveContent
                items={visibleItems}
                totalCount={items.length}
                visibleCount={visibleCount}
                isSearchMode={isSearchMode}
                isLoading={isLoading}
                error={error}
                viewMode={viewMode}
                onOpenFolder={openFolder}
                onShare={setShareTarget}
                onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              />
            </>
          ) : activeSection === "trash" ? (
            <TrashContent
              items={trashItems}
              isLoading={trash.isLoading}
              error={trash.error ?? restoreTrashItem.error ?? permanentDeleteTrashItem.error}
              viewMode={viewMode}
              pendingAction={pendingTrashAction}
              onRestore={(target) => restoreTrashItem.mutate(target)}
              onPermanentDelete={handlePermanentDelete}
            />
          ) : (
            <SectionPlaceholder />
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
  icon: ReactNode;
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
  items,
  totalCount,
  visibleCount,
  isSearchMode,
  isLoading,
  error,
  viewMode,
  onOpenFolder,
  onShare,
  onShowMore,
}: {
  items: BrowserItem[];
  totalCount: number;
  visibleCount: number;
  isSearchMode: boolean;
  isLoading: boolean;
  error: unknown;
  viewMode: ViewMode;
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
  onShowMore: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-brand" size={20} aria-hidden="true" />
          <span className="text-sm font-medium">{isSearchMode ? "Searching" : "Loading drive"}</span>
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

  if (totalCount === 0) {
    return (
      <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white">
        <div className="text-center">
          <Folder className="mx-auto text-slate-300" size={38} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-700">
            {isSearchMode ? "No matching items" : "No files or folders"}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{totalCount} items</span>
        <span>
          Showing {Math.min(visibleCount, totalCount)} of {totalCount}
        </span>
      </div>
      {viewMode === "grid" ? (
        <GridView items={items} onOpenFolder={onOpenFolder} onShare={onShare} />
      ) : (
        <ListView items={items} onOpenFolder={onOpenFolder} onShare={onShare} />
      )}
      {visibleCount < totalCount ? (
        <button
          className="mx-auto mt-5 flex h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
          onClick={onShowMore}
        >
          Show more
        </button>
      ) : null}
    </>
  );
}

function ListView({
  items,
  onOpenFolder,
  onShare,
}: {
  items: BrowserItem[];
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_150px_120px_52px] border-b border-line bg-panel px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <span>Name</span>
          <span>Type</span>
          <span>Updated</span>
          <span>Size</span>
          <span />
        </div>
        {items.map((item) => (
          <div
            className="grid h-14 grid-cols-[minmax(0,1fr)_120px_150px_120px_52px] items-center border-b border-line px-4 transition hover:bg-blue-50"
            key={`${item.kind}-${item.id}`}
          >
            {item.kind === "folder" ? (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(item.id)}>
                <ItemName icon={<Folder size={19} />} name={item.name} />
              </button>
            ) : (
              <ItemName icon={<FileText size={19} />} name={item.name} />
            )}
            <span className="truncate text-sm text-slate-500">{item.kind === "folder" ? "Folder" : item.mimeType}</span>
            <span className="text-sm text-slate-500">{formatDate(item.updatedAt)}</span>
            <span className="text-sm text-slate-500">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</span>
            <ShareAction
              onClick={() => onShare({ id: item.id, type: item.kind, name: item.name })}
              label={`Share ${item.name}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GridView({
  items,
  onOpenFolder,
  onShare,
}: {
  items: BrowserItem[];
  onOpenFolder: (folderId: string) => void;
  onShare: (target: ShareTarget) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className="min-h-32 rounded-lg border border-line bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          key={`${item.kind}-${item.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            {item.kind === "folder" ? (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(item.id)}>
                <ItemName icon={<Folder size={21} />} name={item.name} />
              </button>
            ) : (
              <ItemName icon={<FileText size={21} />} name={item.name} />
            )}
            <ShareAction
              onClick={() => onShare({ id: item.id, type: item.kind, name: item.name })}
              label={`Share ${item.name}`}
            />
          </div>
          <p className="mt-3 truncate text-sm text-slate-500">{item.kind === "folder" ? "Folder" : item.mimeType}</p>
          <p className="mt-1 text-sm text-slate-500">{formatDate(item.updatedAt)}</p>
          <p className="mt-1 text-sm text-slate-500">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</p>
        </div>
      ))}
    </div>
  );
}

function ItemName({ icon, name }: { icon: ReactNode; name: string }) {
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
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-10 w-10 items-center justify-center rounded-md transition ${
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

function TrashContent({
  items,
  isLoading,
  error,
  viewMode,
  pendingAction,
  onRestore,
  onPermanentDelete,
}: {
  items: TrashItem[];
  isLoading: boolean;
  error: unknown;
  viewMode: ViewMode;
  pendingAction: string | null;
  onRestore: (target: TrashTarget) => void;
  onPermanentDelete: (target: TrashTarget, name: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin text-brand" size={20} aria-hidden="true" />
          <span className="text-sm font-medium">Loading trash</span>
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

  if (items.length === 0) {
    return (
      <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white">
        <div className="text-center">
          <Trash2 className="mx-auto text-slate-300" size={38} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-700">Trash is empty</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 text-sm text-slate-500">{items.length} deleted items</div>
      {viewMode === "grid" ? (
        <TrashGrid
          items={items}
          pendingAction={pendingAction}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      ) : (
        <TrashList
          items={items}
          pendingAction={pendingAction}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      )}
    </>
  );
}

function TrashList({
  items,
  pendingAction,
  onRestore,
  onPermanentDelete,
}: {
  items: TrashItem[];
  pendingAction: string | null;
  onRestore: (target: TrashTarget) => void;
  onPermanentDelete: (target: TrashTarget, name: string) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_150px_120px_116px] border-b border-line bg-panel px-4 py-3 text-xs font-semibold uppercase text-slate-500">
          <span>Name</span>
          <span>Type</span>
          <span>Deleted</span>
          <span>Size</span>
          <span>Actions</span>
        </div>
        {items.map((item) => (
          <div
            className="grid h-14 grid-cols-[minmax(0,1fr)_120px_150px_120px_116px] items-center border-b border-line px-4 transition hover:bg-blue-50"
            key={`${item.kind}-${item.id}`}
          >
            <ItemName
              icon={item.kind === "folder" ? <Folder size={19} /> : <FileText size={19} />}
              name={item.name}
            />
            <span className="truncate text-sm text-slate-500">{item.kind === "folder" ? "Folder" : item.mimeType}</span>
            <span className="text-sm text-slate-500">{formatOptionalDate(item.deletedAt)}</span>
            <span className="text-sm text-slate-500">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</span>
            <TrashActions
              item={item}
              pendingAction={pendingAction}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrashGrid({
  items,
  pendingAction,
  onRestore,
  onPermanentDelete,
}: {
  items: TrashItem[];
  pendingAction: string | null;
  onRestore: (target: TrashTarget) => void;
  onPermanentDelete: (target: TrashTarget, name: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div className="min-h-36 rounded-lg border border-line bg-white p-4 shadow-sm" key={`${item.kind}-${item.id}`}>
          <div className="flex items-start justify-between gap-3">
            <ItemName
              icon={item.kind === "folder" ? <Folder size={21} /> : <FileText size={21} />}
              name={item.name}
            />
            <TrashActions
              item={item}
              pendingAction={pendingAction}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
            />
          </div>
          <p className="mt-3 truncate text-sm text-slate-500">{item.kind === "folder" ? "Folder" : item.mimeType}</p>
          <p className="mt-1 text-sm text-slate-500">Deleted {formatOptionalDate(item.deletedAt)}</p>
          <p className="mt-1 text-sm text-slate-500">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</p>
        </div>
      ))}
    </div>
  );
}

function TrashActions({
  item,
  pendingAction,
  onRestore,
  onPermanentDelete,
}: {
  item: TrashItem;
  pendingAction: string | null;
  onRestore: (target: TrashTarget) => void;
  onPermanentDelete: (target: TrashTarget, name: string) => void;
}) {
  const target = { id: item.id, type: item.kind };
  const restoreKey = `restore-${item.kind}-${item.id}`;
  const deleteKey = `delete-${item.kind}-${item.id}`;

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        aria-label={`Restore ${item.name}`}
        title={`Restore ${item.name}`}
        onClick={() => onRestore(target)}
        disabled={Boolean(pendingAction)}
      >
        {pendingAction === restoreKey ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <RotateCcw size={16} aria-hidden="true" />
        )}
      </button>
      <button
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        aria-label={`Permanently delete ${item.name}`}
        title={`Permanently delete ${item.name}`}
        onClick={() => onPermanentDelete(target, item.name)}
        disabled={Boolean(pendingAction)}
      >
        {pendingAction === deleteKey ? (
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
        ) : (
          <Trash2 size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function SectionPlaceholder() {
  return (
    <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-line bg-white">
      <div className="text-center">
        <Share2 className="mx-auto text-slate-300" size={38} aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-slate-700">Shared</h2>
      </div>
    </div>
  );
}

function normalizeDriveItems(folders: FolderItem[], files: FileItem[]): BrowserItem[] {
  return [
    ...folders.map((folder) => ({
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      mimeType: null,
      sizeBytes: null,
      updatedAt: folder.updated_at,
    })),
    ...files.map((file) => ({
      id: file.id,
      kind: "file" as const,
      name: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      updatedAt: file.updated_at,
    })),
  ];
}

function normalizeSearchItems(
  items: {
    id: string;
    item_type: "file" | "folder";
    name: string;
    mime_type: string | null;
    size_bytes: number | null;
    updated_at: string;
  }[],
): BrowserItem[] {
  return items.map((item) => ({
    id: item.id,
    kind: item.item_type,
    name: item.name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    updatedAt: item.updated_at,
  }));
}

function normalizeTrashItems(folders: FolderItem[], files: FileItem[]): TrashItem[] {
  return [
    ...folders.map((folder) => ({
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      mimeType: null,
      sizeBytes: null,
      updatedAt: folder.updated_at,
      deletedAt: folder.deleted_at,
    })),
    ...files.map((file) => ({
      id: file.id,
      kind: "file" as const,
      name: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      updatedAt: file.updated_at,
      deletedAt: file.deleted_at,
    })),
  ].sort((left, right) => {
    const leftDeleted = left.deletedAt ? new Date(left.deletedAt).getTime() : 0;
    const rightDeleted = right.deletedAt ? new Date(right.deletedAt).getTime() : 0;
    return rightDeleted - leftDeleted;
  });
}

function sortItems(items: BrowserItem[], sortBy: SortBy, direction: SortDirection) {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    if (left.kind !== right.kind && sortBy !== "size") {
      return left.kind === "folder" ? -1 : 1;
    }

    if (sortBy === "name") {
      return left.name.localeCompare(right.name) * multiplier;
    }

    if (sortBy === "size") {
      return ((left.sizeBytes ?? -1) - (right.sizeBytes ?? -1)) * multiplier;
    }

    return (new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()) * multiplier;
  });
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

function getSortIcon(sortBy: SortBy, direction: SortDirection) {
  if (sortBy === "name") {
    return direction === "asc" ? <ArrowDownAZ size={17} /> : <ArrowUpAZ size={17} />;
  }
  return direction === "asc" ? <ArrowDownWideNarrow size={17} /> : <ArrowUpWideNarrow size={17} />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatOptionalDate(value: string | null) {
  return value ? formatDate(value) : "-";
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
