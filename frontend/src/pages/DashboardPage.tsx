import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  Clock3,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  Bell,
  Camera,
  CircleHelp,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  Grid2X2,
  HardDrive,
  House,
  List,
  Loader2,
  LogOut,
  MoveRight,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Share2,
  Save,
  Star,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";

import { getApiErrorMessage } from "../services/api";
import { useCurrentUser, useLogout, useUpdateProfile } from "../hooks/useAuth";
import {
  useActivities,
  useAllFolders,
  buildBreadcrumbs,
  useCreateFolder,
  useDeleteDriveItem,
  useDriveItems,
  useFileDownload,
  useFileVersions,
  useFolderDetail,
  useSharedItems,
  useStarredItems,
  useToggleStar,
  useUpdateFile,
  useUpdateFolder,
} from "../hooks/useDrive";
import { useSearchItems } from "../hooks/useSearch";
import { usePermanentDeleteTrashItem, useRestoreTrashItem, useTrash } from "../hooks/useTrash";
import type { FileItem, Folder as FolderItem } from "../services/drive";
import { ShareModal } from "../components/ShareModal";
import type { ShareTarget } from "../services/sharing";
import type { TrashTarget } from "../services/trash";
import { UploadPanel } from "../components/UploadPanel";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusState";

type ViewMode = "list" | "grid";
type SectionKey = "home" | "my-drive" | "starred" | "shared" | "activity" | "trash";
type SortBy = "name" | "updated" | "size";
type SortDirection = "asc" | "desc";
type BrowserItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  updatedAt: string;
  starred: boolean;
};
type TrashItem = BrowserItem & {
  deletedAt: string | null;
};
type FilePreview = {
  id: string;
  name: string;
  mimeType: string | null;
  url: string;
};
type MoveTarget = BrowserItem | null;
type VersionsTarget = BrowserItem | null;
type TopMenu = "help" | "settings" | "profile" | null;

const PAGE_SIZE = 12;

export function DashboardPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("home");
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
  const updateProfile = useUpdateProfile();
  const folderDetail = useFolderDetail(currentFolderId);
  const driveItems = useDriveItems(activeSection === "my-drive" ? currentFolderId : null);
  const sharedItems = useSharedItems(activeSection === "shared");
  const starredItems = useStarredItems(Boolean(user));
  const activities = useActivities(activeSection === "activity");
  const searchItems = useSearchItems(searchQuery, mimeType);
  const trash = useTrash();
  const fileDownload = useFileDownload();
  const createFolder = useCreateFolder(currentFolderId);
  const updateFile = useUpdateFile();
  const updateFolder = useUpdateFolder();
  const deleteDriveItem = useDeleteDriveItem();
  const toggleStar = useToggleStar();
  const restoreTrashItem = useRestoreTrashItem();
  const permanentDeleteTrashItem = usePermanentDeleteTrashItem();
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [moveTarget, setMoveTarget] = useState<MoveTarget>(null);
  const [versionsTarget, setVersionsTarget] = useState<VersionsTarget>(null);
  const [activeTopMenu, setActiveTopMenu] = useState<TopMenu>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const breadcrumbs = buildBreadcrumbs(currentFolderId, folderDetail.data?.breadcrumbs);
  const isSearchMode = Boolean(searchQuery.trim() || mimeType.trim());
  const starredIds = useMemo(() => {
    return {
      files: new Set((starredItems.data?.files ?? []).map((file) => file.id)),
      folders: new Set((starredItems.data?.folders ?? []).map((folder) => folder.id)),
    };
  }, [starredItems.data]);
  const items = useMemo(() => {
    const baseItems = isSearchMode
      ? normalizeSearchItems(searchItems.data?.results ?? [], starredIds)
      : normalizeDriveItems(driveItems.data?.folders ?? [], driveItems.data?.files ?? [], starredIds);
    return sortItems(baseItems, sortBy, sortDirection);
  }, [driveItems.data, isSearchMode, searchItems.data, sortBy, sortDirection, starredIds]);
  const sharedBrowserItems = useMemo(() => {
    return sortItems(normalizeDriveItems(sharedItems.data?.folders ?? [], sharedItems.data?.files ?? [], starredIds), sortBy, sortDirection);
  }, [sharedItems.data, sortBy, sortDirection, starredIds]);
  const starredBrowserItems = useMemo(() => {
    return sortItems(normalizeDriveItems(starredItems.data?.folders ?? [], starredItems.data?.files ?? [], starredIds, true), sortBy, sortDirection);
  }, [starredItems.data, sortBy, sortDirection, starredIds]);
  const trashItems = useMemo(
    () => normalizeTrashItems(trash.data?.folders ?? [], trash.data?.files ?? []),
    [trash.data],
  );
  const visibleItems = items.slice(0, visibleCount);
  const visibleSharedItems = sharedBrowserItems.slice(0, visibleCount);
  const visibleStarredItems = starredBrowserItems.slice(0, visibleCount);
  const isLoading = isSearchMode ? searchItems.isLoading : driveItems.isLoading || folderDetail.isLoading;
  const error = isSearchMode ? searchItems.error : driveItems.error ?? folderDetail.error ?? actionError;
  const pendingTrashAction =
    restoreTrashItem.isPending && restoreTrashItem.variables
      ? `restore-${restoreTrashItem.variables.type}-${restoreTrashItem.variables.id}`
      : permanentDeleteTrashItem.isPending && permanentDeleteTrashItem.variables
        ? `delete-${permanentDeleteTrashItem.variables.type}-${permanentDeleteTrashItem.variables.id}`
        : null;

  function openSection(section: SectionKey) {
    setActiveTopMenu(null);
    setActiveSection(section);
    setCurrentFolderId(null);
    setSearchQuery("");
    setMimeType("");
    setVisibleCount(PAGE_SIZE);
  }

  function openFolder(folderId: string) {
    setActiveSection("my-drive");
    setSearchQuery("");
    setMimeType("");
    setCurrentFolderId(folderId);
    setVisibleCount(PAGE_SIZE);
  }

  async function handleCreateFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) {
      return;
    }
    setActionError(null);
    try {
      await createFolder.mutateAsync(name.trim());
    } catch (createError) {
      setActionError(getApiErrorMessage(createError));
    }
  }

  async function handleRename(item: BrowserItem) {
    const name = window.prompt(`Rename ${item.kind}`, item.name);
    if (!name?.trim() || name.trim() === item.name) {
      return;
    }
    setActionError(null);
    try {
      if (item.kind === "file") {
        await updateFile.mutateAsync({ id: item.id, name: name.trim() });
      } else {
        await updateFolder.mutateAsync({ id: item.id, name: name.trim() });
      }
    } catch (renameError) {
      setActionError(getApiErrorMessage(renameError));
    }
  }

  async function handleMove(item: BrowserItem, targetFolderId: string | null) {
    setActionError(null);
    try {
      if (item.kind === "file") {
        await updateFile.mutateAsync({ id: item.id, folder_id: targetFolderId });
      } else {
        await updateFolder.mutateAsync({ id: item.id, parent_id: targetFolderId });
      }
      setMoveTarget(null);
    } catch (moveError) {
      setActionError(getApiErrorMessage(moveError));
    }
  }

  async function handleDelete(item: BrowserItem) {
    if (!window.confirm(`Move "${item.name}" to Trash?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteDriveItem.mutateAsync({ type: item.kind, id: item.id });
    } catch (deleteError) {
      setActionError(getApiErrorMessage(deleteError));
    }
  }

  async function handleToggleStar(item: BrowserItem) {
    setActionError(null);
    try {
      await toggleStar.mutateAsync({ type: item.kind, id: item.id, starred: item.starred });
    } catch (starError) {
      setActionError(getApiErrorMessage(starError));
    }
  }

  function handlePermanentDelete(target: TrashTarget, name: string) {
    if (window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
      permanentDeleteTrashItem.mutate(target);
    }
  }

  async function openFile(item: BrowserItem, mode: "preview" | "download" = "preview") {
    setActionError(null);
    try {
      const file = await fileDownload.mutateAsync(item.id);
      if (mode === "download") {
        window.open(file.download_url, "_self", "noopener,noreferrer");
        return;
      }
      setFilePreview({ id: item.id, name: item.name, mimeType: item.mimeType, url: file.download_url });
    } catch (downloadError) {
      setActionError(getApiErrorMessage(downloadError));
    }
  }

  const userInitial = (user?.full_name || user?.email || "U").trim().charAt(0).toUpperCase();
  const userProfileImageUrl = user?.profile_image_url || null;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f7faf8] text-ink">
      <header className="sticky top-0 z-30 border-b border-[#dce8e2] bg-[#f7faf8]/92 px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="grid items-center gap-3 lg:grid-cols-[280px_minmax(260px,760px)_1fr]">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_70%,#8ac7b0_150%)] text-[#f6fbf8] shadow-md shadow-[#092c28]/18">
              <HardDrive size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-black tracking-normal text-ink">CloudDrive</p>
              <p className="text-xs font-semibold text-[#6e827c]">Media storage</p>
            </div>
          </div>
          <div className="flex h-[52px] min-w-0 items-center gap-3 rounded-full bg-[#e9f1ee] px-5 text-[#607872] shadow-inner">
            <Search size={20} aria-hidden="true" />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold outline-none placeholder:text-[#7e938d]"
              placeholder="Search in CloudDrive"
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setActiveSection("my-drive");
                setSearchQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
          <div className="relative flex items-center justify-end gap-2">
            <TopActionButton
              active={activeTopMenu === "help"}
              label="Help"
              icon={<CircleHelp size={20} aria-hidden="true" />}
              onClick={() => setActiveTopMenu(activeTopMenu === "help" ? null : "help")}
            />
            <TopActionButton
              active={activeTopMenu === "settings"}
              label="Settings"
              icon={<Settings size={20} aria-hidden="true" />}
              onClick={() => setActiveTopMenu(activeTopMenu === "settings" ? null : "settings")}
            />
            <button
              className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-black text-white shadow-md shadow-[#092c28]/15 transition hover:-translate-y-0.5 ${
                activeTopMenu === "profile" ? "bg-[#0f2b28] ring-4 ring-[#8ac7b0]/35" : "bg-brand"
              }`}
              type="button"
              aria-label="Open profile menu"
              title="Profile"
              onClick={() => setActiveTopMenu(activeTopMenu === "profile" ? null : "profile")}
            >
              {userProfileImageUrl ? (
                <img className="h-full w-full object-cover" src={userProfileImageUrl} alt="Profile" />
              ) : (
                userInitial
              )}
            </button>

            {activeTopMenu ? (
              <TopMenuPanel onClose={() => setActiveTopMenu(null)}>
                {activeTopMenu === "profile" ? (
                  <ProfileMenu
                    userInitial={userInitial}
                    name={user?.full_name || "CloudDrive user"}
                    email={user?.email || ""}
                    profileImageUrl={userProfileImageUrl}
                    isUpdating={updateProfile.isPending}
                    updateError={updateProfile.error}
                    onUpdateProfile={(payload) => updateProfile.mutateAsync(payload)}
                    isLoggingOut={logout.isPending}
                    onNavigate={openSection}
                    onLogout={() => {
                      setActiveTopMenu(null);
                      logout.mutate();
                    }}
                  />
                ) : activeTopMenu === "settings" ? (
                  <SettingsMenu
                    viewMode={viewMode}
                    sortDirection={sortDirection}
                    onViewModeChange={setViewMode}
                    onSortDirectionChange={setSortDirection}
                  />
                ) : (
                  <HelpMenu />
                )}
              </TopMenuPanel>
            ) : null}
            {activeTopMenu ? (
              <button
                className="fixed inset-0 -z-10 cursor-default"
                type="button"
                aria-label="Close top menu"
                tabIndex={-1}
                onClick={() => setActiveTopMenu(null)}
              />
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-73px)] grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr] lg:p-5">
        <aside className="rounded-[28px] border border-[#dce8e2] bg-white/74 px-4 py-5 shadow-[0_18px_44px_rgba(9,44,40,0.09)] backdrop-blur-xl lg:sticky lg:top-[92px] lg:h-[calc(100dvh-116px)]">
          <button
            className="mb-7 flex h-14 items-center gap-3 rounded-2xl bg-white px-5 text-base font-black text-ink shadow-[0_10px_28px_rgba(9,44,40,0.12)] transition hover:-translate-y-0.5 hover:text-brand"
            type="button"
            onClick={() => {
              setActiveSection("my-drive");
              void handleCreateFolder();
            }}
          >
            <Plus size={22} aria-hidden="true" />
            New
          </button>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:block lg:space-y-2">
            <SidebarItem
              icon={<House size={18} />}
              label="Home"
              active={activeSection === "home"}
              onClick={() => openSection("home")}
            />
            <SidebarItem
              icon={<HardDrive size={18} />}
              label="My Drive"
              active={activeSection === "my-drive"}
              onClick={() => openSection("my-drive")}
            />
            <SidebarItem
              icon={<Star size={18} />}
              label="Starred"
              active={activeSection === "starred"}
              onClick={() => openSection("starred")}
            />
            <SidebarItem
              icon={<Share2 size={18} />}
              label="Shared"
              active={activeSection === "shared"}
              onClick={() => openSection("shared")}
            />
            <SidebarItem
              icon={<Clock3 size={18} />}
              label="Activity"
              active={activeSection === "activity"}
              onClick={() => openSection("activity")}
            />
            <SidebarItem
              icon={<Trash2 size={18} />}
              label="Trash"
              active={activeSection === "trash"}
              onClick={() => openSection("trash")}
            />
          </nav>

          <div className="mt-8 rounded-[22px] border border-[#dce8e2] bg-[#f6fbf8]/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
              {userProfileImageUrl ? (
                <img className="h-6 w-6 rounded-full object-cover" src={userProfileImageUrl} alt="Profile" />
              ) : (
                <UserCircle size={18} aria-hidden="true" />
              )}
              <span className="truncate">{user?.full_name || user?.email}</span>
            </div>
            <button
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#c8dcd5] bg-white/78 text-sm font-extrabold text-[#49645f] transition hover:-translate-y-0.5 hover:bg-white hover:text-brand"
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 rounded-[28px] bg-transparent p-1 sm:p-3">
          <header className="flex flex-col gap-5 pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <Breadcrumbs
                  items={getHeaderBreadcrumbs(activeSection, breadcrumbs)}
                  onSelect={(folderId) => {
                    setActiveSection("my-drive");
                    setCurrentFolderId(folderId);
                    setSearchQuery("");
                    setMimeType("");
                    setVisibleCount(PAGE_SIZE);
                  }}
                />
                <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">
                  {isSearchMode ? "Search Results" : getSectionTitle(activeSection)}
                </h1>
              </div>

              <div className="flex h-14 w-fit rounded-full border border-[#dce8e2] bg-white p-1.5 shadow-sm">
                {activeSection === "my-drive" && !isSearchMode ? (
                  <button
                    className="mr-2 flex h-11 items-center justify-center gap-2 rounded-full bg-[#f7faf8] px-4 text-sm font-extrabold text-[#49645f] shadow-sm transition hover:-translate-y-0.5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => void handleCreateFolder()}
                    disabled={createFolder.isPending}
                  >
                    {createFolder.isPending ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <FolderPlus size={16} aria-hidden="true" />}
                    New folder
                  </button>
                ) : null}
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

            <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_210px_210px_56px]">
              <div className="hidden h-14 min-w-0 items-center gap-3 rounded-2xl border border-[#dce8e2] bg-white px-4 text-[#6e827c] shadow-sm xl:flex">
                <Search size={17} aria-hidden="true" />
                <span className="truncate text-base font-semibold text-[#7e938d]">
                  {searchQuery || "Use the top search bar"}
                </span>
              </div>
              <select
                className="h-14 rounded-2xl border border-[#dce8e2] bg-white px-4 text-base font-extrabold text-[#49645f] shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
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
                className="h-14 rounded-2xl border border-[#dce8e2] bg-white px-4 text-base font-extrabold text-[#49645f] shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
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

          {activeSection === "home" ? (
            <>
              {!isSearchMode ? (
                <SuggestedShelves
                  items={items}
                  onOpenFolder={openFolder}
                  onOpenFile={openFile}
                />
              ) : null}
              <DriveContent
                items={visibleItems}
                totalCount={items.length}
                visibleCount={visibleCount}
                isSearchMode={isSearchMode}
                isLoading={isLoading}
                error={error}
                viewMode={viewMode}
                onOpenFolder={openFolder}
                onOpenFile={openFile}
                onRename={handleRename}
                onMove={setMoveTarget}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onVersions={setVersionsTarget}
                onShare={setShareTarget}
                onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              />
            </>
          ) : activeSection === "my-drive" ? (
            <>
              {!isSearchMode ? (
                <SuggestedShelves
                  items={items}
                  onOpenFolder={openFolder}
                  onOpenFile={openFile}
                />
              ) : null}
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
                onOpenFile={openFile}
                onRename={handleRename}
                onMove={setMoveTarget}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
                onVersions={setVersionsTarget}
                onShare={setShareTarget}
                onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              />
            </>
          ) : activeSection === "starred" ? (
            <DriveContent
              items={visibleStarredItems}
              totalCount={starredBrowserItems.length}
              visibleCount={visibleCount}
              isSearchMode={false}
              isLoading={starredItems.isLoading}
              error={starredItems.error ?? actionError}
              viewMode={viewMode}
              onOpenFolder={openFolder}
              onOpenFile={openFile}
              onRename={handleRename}
              onMove={setMoveTarget}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onVersions={setVersionsTarget}
              onShare={setShareTarget}
              onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
            />
          ) : activeSection === "shared" ? (
            <DriveContent
              items={visibleSharedItems}
              totalCount={sharedBrowserItems.length}
              visibleCount={visibleCount}
              isSearchMode={false}
              isLoading={sharedItems.isLoading}
              error={sharedItems.error ?? actionError}
              viewMode={viewMode}
              onOpenFolder={openFolder}
              onOpenFile={openFile}
              onRename={handleRename}
              onMove={setMoveTarget}
              onDelete={handleDelete}
              onToggleStar={handleToggleStar}
              onVersions={setVersionsTarget}
              onShare={setShareTarget}
              onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
            />
          ) : activeSection === "activity" ? (
            <ActivityContent isLoading={activities.isLoading} error={activities.error} activities={activities.data ?? []} />
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
          ) : null}
        </section>
      </div>
      {shareTarget ? <ShareModal target={shareTarget} onClose={() => setShareTarget(null)} /> : null}
      {filePreview ? <PreviewModal preview={filePreview} onClose={() => setFilePreview(null)} /> : null}
      {moveTarget ? (
        <MoveModal
          target={moveTarget}
          onClose={() => setMoveTarget(null)}
          onMove={(folderId) => void handleMove(moveTarget, folderId)}
        />
      ) : null}
      {versionsTarget ? <VersionsModal target={versionsTarget} onClose={() => setVersionsTarget(null)} /> : null}
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
      className={`flex h-[52px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
        active
          ? "bg-[linear-gradient(135deg,#123632_0%,#1c6a61_72%,#8ac7b0_160%)] text-[#f6fbf8] shadow-lg shadow-[#092c28]/15"
          : "border border-transparent bg-white/38 text-[#49645f] hover:border-white/80 hover:bg-white/70 hover:text-brand"
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function TopActionButton({
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
      className={`flex h-11 w-11 items-center justify-center rounded-full text-[#49645f] transition hover:bg-[#e9f1ee] ${
        active ? "bg-[#e9f1ee] ring-4 ring-[#8ac7b0]/25" : ""
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

function TopMenuPanel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <section className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-[#dce8e2] bg-white shadow-[0_26px_70px_rgba(9,44,40,0.2)]">
      <button
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#6e827c] transition hover:bg-[#eef3f1] hover:text-brand"
        type="button"
        aria-label="Close menu"
        title="Close"
        onClick={onClose}
      >
        <X size={16} aria-hidden="true" />
      </button>
      {children}
    </section>
  );
}

function ProfileMenu({
  userInitial,
  name,
  email,
  profileImageUrl,
  isUpdating,
  updateError,
  onUpdateProfile,
  isLoggingOut,
  onNavigate,
  onLogout,
}: {
  userInitial: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  isUpdating: boolean;
  updateError: unknown;
  onUpdateProfile: (payload: { full_name: string | null; email: string; profile_image_url: string | null }) => Promise<unknown>;
  isLoggingOut: boolean;
  onNavigate: (section: SectionKey) => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"account" | "update">("account");
  const [fullName, setFullName] = useState(name === "CloudDrive user" ? "" : name);
  const [profileEmail, setProfileEmail] = useState(email);
  const [imageUrl, setImageUrl] = useState(profileImageUrl ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const displayImage = imageUrl || profileImageUrl;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    try {
      await onUpdateProfile({
        full_name: fullName.trim() || null,
        email: profileEmail.trim(),
        profile_image_url: imageUrl.trim() || null,
      });
      setActiveTab("account");
    } catch (error) {
      setLocalError(getApiErrorMessage(error));
    }
  }

  function handleImageSelect(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLocalError("Select an image file for profile photo.");
      return;
    }
    if (file.size > 750_000) {
      setLocalError("Profile image must be smaller than 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(typeof reader.result === "string" ? reader.result : "");
      setLocalError(null);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="bg-[#f3faf6] px-5 pb-5 pt-6 text-center">
        {displayImage ? (
          <img
            className="mx-auto h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg shadow-[#092c28]/18"
            src={displayImage}
            alt={`${name} profile`}
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-black text-white shadow-lg shadow-[#092c28]/18">
            {userInitial}
          </div>
        )}
        <h2 className="mt-4 truncate text-xl font-black text-ink">{name}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-[#6e827c]">{email}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-[#e7f0ec] p-3">
        <button
          className={`h-10 rounded-2xl text-sm font-black transition ${
            activeTab === "account" ? "bg-brand text-white shadow-sm" : "bg-[#eef3f1] text-[#49645f] hover:bg-[#e4eeea]"
          }`}
          type="button"
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button
          className={`h-10 rounded-2xl text-sm font-black transition ${
            activeTab === "update" ? "bg-brand text-white shadow-sm" : "bg-[#eef3f1] text-[#49645f] hover:bg-[#e4eeea]"
          }`}
          type="button"
          onClick={() => setActiveTab("update")}
        >
          Update profile
        </button>
      </div>

      {activeTab === "account" ? (
        <div className="space-y-2 p-3">
        <MenuButton icon={<House size={17} />} label="Home" onClick={() => onNavigate("home")} />
        <MenuButton icon={<HardDrive size={17} />} label="My Drive" onClick={() => onNavigate("my-drive")} />
          <MenuButton icon={<Star size={17} />} label="Starred files" onClick={() => onNavigate("starred")} />
          <MenuButton icon={<Share2 size={17} />} label="Shared with me" onClick={() => onNavigate("shared")} />
          <MenuButton icon={<Clock3 size={17} />} label="Activity" onClick={() => onNavigate("activity")} />
        </div>
      ) : (
        <form className="space-y-4 p-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block text-sm font-extrabold text-ink">
            Profile image
            <span className="mt-2 flex items-center gap-3">
              {displayImage ? (
                <img className="h-14 w-14 rounded-full object-cover" src={displayImage} alt="Profile preview" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-lg font-black text-white">
                  {userInitial}
                </span>
              )}
              <span className="relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-[#c8dcd5] bg-white px-4 text-sm font-black text-[#49645f] transition hover:text-brand">
                <Camera size={16} aria-hidden="true" />
                Upload photo
                <input
                  className="absolute inset-0 cursor-pointer opacity-0"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageSelect(event.target.files?.[0])}
                />
              </span>
            </span>
          </label>

          <label className="block text-sm font-extrabold text-ink">
            Full name
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-[#c8dcd5] bg-white px-4 text-sm font-bold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/30"
              type="text"
              value={fullName}
              maxLength={255}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>

          <label className="block text-sm font-extrabold text-ink">
            Email
            <input
              className="mt-2 h-12 w-full rounded-2xl border border-[#c8dcd5] bg-white px-4 text-sm font-bold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/30"
              type="email"
              value={profileEmail}
              required
              onChange={(event) => setProfileEmail(event.target.value)}
            />
          </label>

          {localError || updateError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {localError || getApiErrorMessage(updateError)}
            </p>
          ) : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_72%,#62aa98_150%)] text-sm font-black text-white shadow-md shadow-[#092c28]/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            Save profile
          </button>
        </form>
      )}

      <div className="border-t border-[#e7f0ec] p-3">
        <button
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f2b28] px-4 text-sm font-black text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
          Logout
        </button>
      </div>
    </div>
  );
}

function SettingsMenu({
  viewMode,
  sortDirection,
  onViewModeChange,
  onSortDirectionChange,
}: {
  viewMode: ViewMode;
  sortDirection: SortDirection;
  onViewModeChange: (mode: ViewMode) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}) {
  return (
    <div className="p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">Workspace settings</p>
      <h2 className="mt-2 text-xl font-black text-ink">Display preferences</h2>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">Default view</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#eef3f1] p-1.5">
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                viewMode === "list" ? "bg-white text-brand shadow-sm" : "text-[#49645f] hover:bg-white/60"
              }`}
              type="button"
              onClick={() => onViewModeChange("list")}
            >
              <List size={16} aria-hidden="true" />
              List
            </button>
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                viewMode === "grid" ? "bg-white text-brand shadow-sm" : "text-[#49645f] hover:bg-white/60"
              }`}
              type="button"
              onClick={() => onViewModeChange("grid")}
            >
              <Grid2X2 size={16} aria-hidden="true" />
              Grid
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">Sort direction</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#eef3f1] p-1.5">
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                sortDirection === "asc" ? "bg-white text-brand shadow-sm" : "text-[#49645f] hover:bg-white/60"
              }`}
              type="button"
              onClick={() => onSortDirectionChange("asc")}
            >
              <ArrowDownWideNarrow size={16} aria-hidden="true" />
              Asc
            </button>
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition ${
                sortDirection === "desc" ? "bg-white text-brand shadow-sm" : "text-[#49645f] hover:bg-white/60"
              }`}
              type="button"
              onClick={() => onSortDirectionChange("desc")}
            >
              <ArrowUpWideNarrow size={16} aria-hidden="true" />
              Desc
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce8e2] bg-[#f7faf8] p-4">
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck size={16} aria-hidden="true" />
            Secure local mode
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#6e827c]">FastAPI, PostgreSQL, JWT auth, signed access URLs, and role-based sharing are active.</p>
        </div>
      </div>
    </div>
  );
}

function HelpMenu() {
  return (
    <div className="p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">CloudDrive help</p>
      <h2 className="mt-2 text-xl font-black text-ink">Quick actions</h2>
      <div className="mt-5 space-y-2">
        <InfoRow icon={<Plus size={17} />} title="Create folder" text="Use New to create folders in My Drive." />
        <InfoRow icon={<Download size={17} />} title="Open or download" text="Use the row action icons beside each file." />
        <InfoRow icon={<Share2 size={17} />} title="Share safely" text="Share with users, roles, or public links." />
        <InfoRow icon={<Bell size={17} />} title="Activity" text="Check uploads, shares, stars, and deletes from Activity." />
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-extrabold text-[#49645f] transition hover:bg-[#eef3f1] hover:text-brand"
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#f3faf6] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black text-ink">{title}</p>
        <p className="mt-0.5 text-sm font-semibold leading-5 text-[#6e827c]">{text}</p>
      </div>
    </div>
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
    <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm font-semibold text-[#6e827c]" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div className="flex min-w-0 items-center gap-1" key={`${item.id ?? "root"}-${index}`}>
          {index > 0 ? <ChevronRight size={15} aria-hidden="true" /> : null}
          <button
            className="max-w-48 truncate rounded-full px-3 py-1.5 font-bold text-[#49645f] hover:bg-white/75 hover:text-brand"
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
  onOpenFile,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
  onVersions,
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
  onOpenFile: (item: BrowserItem, mode?: "preview" | "download") => void;
  onRename: (item: BrowserItem) => void;
  onMove: (item: BrowserItem) => void;
  onDelete: (item: BrowserItem) => void;
  onToggleStar: (item: BrowserItem) => void;
  onVersions: (item: BrowserItem) => void;
  onShare: (target: ShareTarget) => void;
  onShowMore: () => void;
}) {
  if (isLoading) {
    return <LoadingState label={isSearchMode ? "Searching" : "Loading drive"} />;
  }

  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />;
  }

  if (totalCount === 0) {
    return <EmptyState icon={<Folder size={38} aria-hidden="true" />} title={isSearchMode ? "No matching items" : "No files or folders"} />;
  }

  return (
    <>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold text-[#6e827c]">
        <span>{totalCount} items</span>
        <span>
          Showing {Math.min(visibleCount, totalCount)} of {totalCount}
        </span>
      </div>
      {viewMode === "grid" ? (
        <GridView
          items={items}
          onOpenFolder={onOpenFolder}
          onOpenFile={onOpenFile}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onToggleStar={onToggleStar}
          onVersions={onVersions}
          onShare={onShare}
        />
      ) : (
        <ListView
          items={items}
          onOpenFolder={onOpenFolder}
          onOpenFile={onOpenFile}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onToggleStar={onToggleStar}
          onVersions={onVersions}
          onShare={onShare}
        />
      )}
      {visibleCount < totalCount ? (
        <button
          className="mx-auto mt-5 flex h-12 items-center justify-center rounded-2xl border border-white/75 bg-white/78 px-5 text-sm font-extrabold text-[#49645f] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-brand"
          type="button"
          onClick={onShowMore}
        >
          Show more
        </button>
      ) : null}
    </>
  );
}

function SuggestedShelves({
  items,
  onOpenFolder,
  onOpenFile,
}: {
  items: BrowserItem[];
  onOpenFolder: (folderId: string) => void;
  onOpenFile: (item: BrowserItem, mode?: "preview" | "download") => void;
}) {
  const suggestedFolders = items.filter((item) => item.kind === "folder").slice(0, 4);
  const suggestedFiles = items.filter((item) => item.kind === "file").slice(0, 4);

  if (suggestedFolders.length === 0 && suggestedFiles.length === 0) {
    return null;
  }

  return (
    <section className="mt-2 space-y-6">
      {suggestedFolders.length ? (
        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">Suggested folders</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suggestedFolders.map((folder) => (
              <button
                className="flex h-[58px] min-w-0 items-center gap-4 rounded-2xl bg-[#eef3f1] px-4 text-left transition hover:bg-[#e4eeea]"
                key={folder.id}
                type="button"
                onClick={() => onOpenFolder(folder.id)}
              >
                <Folder className="shrink-0 text-[#4e605b]" size={24} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{folder.name}</span>
                  <span className="block truncate text-xs font-medium text-[#6e827c]">in My Drive</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {suggestedFiles.length ? (
        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">Suggested files</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {suggestedFiles.map((file) => (
              <button
                className="min-w-0 overflow-hidden rounded-2xl bg-[#eef3f1] text-left transition hover:bg-[#e4eeea]"
                key={file.id}
                type="button"
                onClick={() => onOpenFile(file)}
              >
                <div className="flex h-14 items-center gap-3 px-4">
                  <FileText className="shrink-0 text-brand" size={22} aria-hidden="true" />
                  <span className="truncate text-sm font-semibold text-ink">{file.name}</span>
                </div>
                <div className="flex aspect-[16/9] items-center justify-center bg-white/78">
                  <FileText className="text-[#9ab3ab]" size={44} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-[#6e827c]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[11px] font-black text-white">A</span>
                  <span className="truncate">Updated {formatDate(file.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ListView({
  items,
  onOpenFolder,
  onOpenFile,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
  onVersions,
  onShare,
}: {
  items: BrowserItem[];
  onOpenFolder: (folderId: string) => void;
  onOpenFile: (item: BrowserItem, mode?: "preview" | "download") => void;
  onRename: (item: BrowserItem) => void;
  onMove: (item: BrowserItem) => void;
  onDelete: (item: BrowserItem) => void;
  onToggleStar: (item: BrowserItem) => void;
  onVersions: (item: BrowserItem) => void;
  onShare: (target: ShareTarget) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[24px] border border-[#dce8e2] bg-white shadow-sm">
      <div className="min-w-[960px]">
        <div className="grid grid-cols-[minmax(0,1fr)_140px_150px_120px_300px] border-b border-[#dce8e2] bg-[#f4f8f6] px-5 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6e827c]">
          <span>Name</span>
          <span>Type</span>
          <span>Updated</span>
          <span>Size</span>
          <span />
        </div>
        {items.map((item) => (
          <div
            className="grid h-16 grid-cols-[minmax(0,1fr)_140px_150px_120px_300px] items-center border-b border-[#e7f0ec] px-5 transition hover:bg-[#f6faf8]"
            key={`${item.kind}-${item.id}`}
          >
            {item.kind === "folder" ? (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(item.id)}>
                <ItemName icon={<Folder size={19} />} name={item.name} />
              </button>
            ) : (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFile(item)}>
                <ItemName icon={<FileText size={19} />} name={item.name} />
              </button>
            )}
            <span className="truncate text-sm font-semibold text-[#6e827c]">{item.kind === "folder" ? "Folder" : item.mimeType}</span>
            <span className="text-sm font-semibold text-[#6e827c]">{formatDate(item.updatedAt)}</span>
            <span className="text-sm font-semibold text-[#6e827c]">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</span>
            <ItemActions
              item={item}
              variant="list"
              onOpenFile={onOpenFile}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              onToggleStar={onToggleStar}
              onVersions={onVersions}
              onShare={onShare}
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
  onOpenFile,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
  onVersions,
  onShare,
}: {
  items: BrowserItem[];
  onOpenFolder: (folderId: string) => void;
  onOpenFile: (item: BrowserItem, mode?: "preview" | "download") => void;
  onRename: (item: BrowserItem) => void;
  onMove: (item: BrowserItem) => void;
  onDelete: (item: BrowserItem) => void;
  onToggleStar: (item: BrowserItem) => void;
  onVersions: (item: BrowserItem) => void;
  onShare: (target: ShareTarget) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          className="min-h-44 overflow-hidden rounded-[24px] border border-[#dce8e2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          key={`${item.kind}-${item.id}`}
        >
          <div className="min-w-0">
            {item.kind === "folder" ? (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFolder(item.id)}>
                <ItemName icon={<Folder size={21} />} name={item.name} />
              </button>
            ) : (
              <button className="min-w-0 text-left" type="button" onClick={() => onOpenFile(item)}>
                <ItemName icon={<FileText size={21} />} name={item.name} />
              </button>
            )}
          </div>
          <div className="mt-4">
            <ItemActions
              item={item}
              variant="grid"
              onOpenFile={onOpenFile}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              onToggleStar={onToggleStar}
              onVersions={onVersions}
              onShare={onShare}
            />
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-[#6e827c]">{item.kind === "folder" ? "Folder" : item.mimeType}</p>
          <p className="mt-1 text-sm font-semibold text-[#6e827c]">{formatDate(item.updatedAt)}</p>
          <p className="mt-1 text-sm font-semibold text-[#6e827c]">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</p>
        </div>
      ))}
    </div>
  );
}

function ItemName({ icon, name }: { icon: ReactNode; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-brand">{icon}</span>
      <span className="truncate text-sm font-extrabold text-ink">{name}</span>
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
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
        active
          ? "bg-[linear-gradient(135deg,#123632_0%,#1c6a61_72%,#8ac7b0_160%)] text-[#f6fbf8] shadow-md shadow-[#092c28]/15"
          : "text-[#6e827c] hover:bg-white/70 hover:text-brand"
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

function ItemActions({
  item,
  variant,
  onOpenFile,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
  onVersions,
  onShare,
}: {
  item: BrowserItem;
  variant?: "list" | "grid";
  onOpenFile: (item: BrowserItem, mode?: "preview" | "download") => void;
  onRename: (item: BrowserItem) => void;
  onMove: (item: BrowserItem) => void;
  onDelete: (item: BrowserItem) => void;
  onToggleStar: (item: BrowserItem) => void;
  onVersions: (item: BrowserItem) => void;
  onShare: (target: ShareTarget) => void;
}) {
  const wrapperClass =
    variant === "grid"
      ? "flex flex-wrap items-center justify-start gap-1"
      : "flex flex-wrap items-center justify-end gap-1";
  const buttonClass = "flex h-8 w-8 items-center justify-center rounded-xl transition";

  return (
    <div className={wrapperClass}>
      <button
        className={`${buttonClass} hover:bg-[#eef3f1] ${
          item.starred ? "text-[#d19718]" : "text-[#6e827c] hover:text-[#d19718]"
        }`}
        type="button"
        aria-label={item.starred ? `Unstar ${item.name}` : `Star ${item.name}`}
        title={item.starred ? "Unstar" : "Star"}
        onClick={() => void onToggleStar(item)}
      >
        <Star size={16} aria-hidden="true" fill={item.starred ? "currentColor" : "none"} />
      </button>
      {item.kind === "file" ? (
        <>
          <button
            className={`${buttonClass} text-[#6e827c] hover:bg-[#eef3f1] hover:text-brand`}
            type="button"
            aria-label={`Open ${item.name}`}
            title={`Open ${item.name}`}
            onClick={() => void onOpenFile(item)}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
          <button
            className={`${buttonClass} text-[#6e827c] hover:bg-[#eef3f1] hover:text-brand`}
            type="button"
            aria-label={`Download ${item.name}`}
            title={`Download ${item.name}`}
            onClick={() => void onOpenFile(item, "download")}
          >
            <Download size={16} aria-hidden="true" />
          </button>
        </>
      ) : null}
      {item.kind === "file" ? (
        <button
          className={`${buttonClass} text-[#6e827c] hover:bg-[#eef3f1] hover:text-brand`}
          type="button"
          aria-label={`View versions for ${item.name}`}
          title="Versions"
          onClick={() => void onVersions(item)}
        >
          <Clock3 size={16} aria-hidden="true" />
        </button>
      ) : null}
      <button
        className={`${buttonClass} text-[#6e827c] hover:bg-[#eef3f1] hover:text-brand`}
        type="button"
        aria-label={`Rename ${item.name}`}
        title={`Rename ${item.name}`}
        onClick={() => void onRename(item)}
      >
        <Edit3 size={16} aria-hidden="true" />
      </button>
      <button
        className={`${buttonClass} text-[#6e827c] hover:bg-[#eef3f1] hover:text-brand`}
        type="button"
        aria-label={`Move ${item.name} to My Drive`}
        title="Move"
        onClick={() => void onMove(item)}
      >
        <MoveRight size={16} aria-hidden="true" />
      </button>
      <ShareAction
        onClick={() => onShare({ id: item.id, type: item.kind, name: item.name })}
        label={`Share ${item.name}`}
      />
      <button
        className={`${buttonClass} text-[#6e827c] hover:bg-red-50 hover:text-red-600`}
        type="button"
        aria-label={`Move ${item.name} to Trash`}
        title="Move to Trash"
        onClick={() => void onDelete(item)}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function ShareAction({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6e827c] transition hover:bg-[#eef3f1] hover:text-brand"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Share2 size={16} aria-hidden="true" />
    </button>
  );
}

function PreviewModal({ preview, onClose }: { preview: FilePreview; onClose: () => void }) {
  const isImage = preview.mimeType?.startsWith("image/");
  const isPdf = preview.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092c28]/42 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-[30px] border border-white/75 bg-[#eef7f3]/92 shadow-soft backdrop-blur-xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/70 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">File preview</p>
            <h2 className="mt-1 truncate text-xl font-black text-ink">{preview.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-extrabold text-[#49645f] shadow-sm hover:text-brand"
              href={preview.url}
            >
              <Download size={15} aria-hidden="true" />
              Download
            </a>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6e827c] hover:bg-white hover:text-brand"
              type="button"
              aria-label="Close preview"
              title="Close"
              onClick={onClose}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-dashed border-[#a8c4bb] bg-white/58">
            {isImage ? (
              <img className="max-h-[70vh] max-w-full rounded-2xl object-contain" src={preview.url} alt={preview.name} />
            ) : isPdf ? (
              <iframe className="h-[70vh] w-full rounded-2xl border-0" src={preview.url} title={preview.name} />
            ) : (
              <div className="px-5 text-center">
                <FileText className="mx-auto text-[#8aa39b]" size={44} aria-hidden="true" />
                <p className="mt-3 text-lg font-black text-ink">Preview is not available for this file type</p>
                <p className="mt-2 text-sm font-semibold text-[#6e827c]">Use Download to open the file locally.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MoveModal({
  target,
  onClose,
  onMove,
}: {
  target: BrowserItem;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const folders = useAllFolders(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const availableFolders = (folders.data ?? []).filter((folder) => folder.id !== target.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092c28]/42 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[30px] border border-white/75 bg-[#eef7f3]/92 shadow-soft backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">Move {target.kind}</p>
            <h2 className="mt-1 truncate text-2xl font-black text-ink">{target.name}</h2>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6e827c] hover:bg-white hover:text-brand"
            type="button"
            aria-label="Close move dialog"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="p-6">
          {folders.isLoading ? (
            <LoadingState label="Loading folders" />
          ) : folders.error ? (
            <ErrorState message={getApiErrorMessage(folders.error)} />
          ) : (
            <>
              <label className="block text-sm font-extrabold text-ink" htmlFor="move-folder">
                Destination
                <select
                  className="mt-2 h-14 w-full rounded-2xl border border-[#c8dcd5] bg-white/86 px-4 text-sm font-extrabold text-[#49645f] outline-none focus:border-brand focus:ring-4 focus:ring-[#8ac7b0]/35"
                  id="move-folder"
                  value={selectedFolderId}
                  onChange={(event) => setSelectedFolderId(event.target.value)}
                >
                  <option value="">My Drive</option>
                  {availableFolders.map((folder) => (
                    <option value={folder.id} key={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  className="flex h-12 items-center justify-center rounded-2xl border border-[#c8dcd5] bg-white/72 px-5 text-sm font-extrabold text-[#49645f] transition hover:bg-white hover:text-brand"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f2b28_0%,#1c6a61_74%,#62aa98_150%)] px-5 text-sm font-extrabold text-[#f6fbf8] shadow-md shadow-[#092c28]/15 transition hover:-translate-y-0.5"
                  type="button"
                  onClick={() => onMove(selectedFolderId || null)}
                >
                  <MoveRight size={16} aria-hidden="true" />
                  Move here
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function VersionsModal({ target, onClose }: { target: BrowserItem; onClose: () => void }) {
  const versions = useFileVersions(target.kind === "file" ? target.id : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092c28]/42 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/75 bg-[#eef7f3]/92 shadow-soft backdrop-blur-xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#6e827c]">File versions</p>
            <h2 className="mt-1 truncate text-2xl font-black text-ink">{target.name}</h2>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6e827c] hover:bg-white hover:text-brand"
            type="button"
            aria-label="Close versions dialog"
            title="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="p-6">
          {versions.isLoading ? (
            <LoadingState label="Loading versions" />
          ) : versions.error ? (
            <ErrorState message={getApiErrorMessage(versions.error)} />
          ) : versions.data?.length ? (
            <div className="space-y-3">
              {versions.data.map((version) => (
                <div className="rounded-[22px] border border-white/75 bg-white/70 p-4 shadow-sm" key={version.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-black text-ink">Version {version.version_number}</p>
                    <p className="text-sm font-bold text-[#6e827c]">{formatDate(version.created_at)}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#49645f]">{formatBytes(version.size_bytes)}</p>
                  {version.checksum ? <p className="mt-1 truncate text-xs font-semibold text-[#6e827c]">Checksum {version.checksum}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Clock3 size={38} aria-hidden="true" />} title="No versions recorded" />
          )}
        </div>
      </section>
    </div>
  );
}

function ActivityContent({
  isLoading,
  error,
  activities,
}: {
  isLoading: boolean;
  error: unknown;
  activities: { id: string; action: string; file_id: string | null; folder_id: string | null; created_at: string }[];
}) {
  if (isLoading) {
    return <LoadingState label="Loading activity" />;
  }

  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />;
  }

  if (activities.length === 0) {
    return <EmptyState icon={<Clock3 size={38} aria-hidden="true" />} title="No activity yet" />;
  }

  return (
    <div className="mt-5 rounded-[24px] border border-white/75 bg-white/72 p-4 shadow-soft backdrop-blur-xl">
      <div className="space-y-3">
        {activities.map((activity) => (
          <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#dff0e8]/70 px-4 py-3" key={activity.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-ink">{formatActivityAction(activity.action)}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#6e827c]">
                {activity.file_id ? `File ${activity.file_id}` : activity.folder_id ? `Folder ${activity.folder_id}` : "Account"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#6e827c]">{formatDate(activity.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
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
    return <LoadingState label="Loading trash" />;
  }

  if (error) {
    return <ErrorState message={getApiErrorMessage(error)} />;
  }

  if (items.length === 0) {
    return <EmptyState icon={<Trash2 size={38} aria-hidden="true" />} title="Trash is empty" />;
  }

  return (
    <>
      <div className="mt-5 text-sm font-bold text-[#6e827c]">{items.length} deleted items</div>
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
    <div className="mt-4 overflow-x-auto rounded-[24px] border border-white/75 bg-white/72 shadow-soft backdrop-blur-xl">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_150px_120px_116px] border-b border-white/70 bg-[#dff0e8]/70 px-5 py-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6e827c]">
          <span>Name</span>
          <span>Type</span>
          <span>Deleted</span>
          <span>Size</span>
          <span>Actions</span>
        </div>
        {items.map((item) => (
          <div
            className="grid h-16 grid-cols-[minmax(0,1fr)_120px_150px_120px_116px] items-center border-b border-white/60 px-5 transition hover:bg-white/60"
            key={`${item.kind}-${item.id}`}
          >
            <ItemName
              icon={item.kind === "folder" ? <Folder size={19} /> : <FileText size={19} />}
              name={item.name}
            />
            <span className="truncate text-sm font-semibold text-[#6e827c]">{item.kind === "folder" ? "Folder" : item.mimeType}</span>
            <span className="text-sm font-semibold text-[#6e827c]">{formatOptionalDate(item.deletedAt)}</span>
            <span className="text-sm font-semibold text-[#6e827c]">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</span>
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
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div className="min-h-36 rounded-[24px] border border-white/75 bg-white/72 p-5 shadow-md shadow-[#092c28]/10" key={`${item.kind}-${item.id}`}>
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
          <p className="mt-3 truncate text-sm font-semibold text-[#6e827c]">{item.kind === "folder" ? "Folder" : item.mimeType}</p>
          <p className="mt-1 text-sm font-semibold text-[#6e827c]">Deleted {formatOptionalDate(item.deletedAt)}</p>
          <p className="mt-1 text-sm font-semibold text-[#6e827c]">{item.sizeBytes === null ? "-" : formatBytes(item.sizeBytes)}</p>
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
        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6e827c] transition hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
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
        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6e827c] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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

function normalizeDriveItems(
  folders: FolderItem[],
  files: FileItem[],
  starredIds?: { files: Set<string>; folders: Set<string> },
  forceStarred = false,
): BrowserItem[] {
  return [
    ...folders.map((folder) => ({
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      mimeType: null,
      sizeBytes: null,
      updatedAt: folder.updated_at,
      starred: forceStarred || Boolean(starredIds?.folders.has(folder.id)),
    })),
    ...files.map((file) => ({
      id: file.id,
      kind: "file" as const,
      name: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      updatedAt: file.updated_at,
      starred: forceStarred || Boolean(starredIds?.files.has(file.id)),
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
  starredIds?: { files: Set<string>; folders: Set<string> },
): BrowserItem[] {
  return items.map((item) => ({
    id: item.id,
    kind: item.item_type,
    name: item.name,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    updatedAt: item.updated_at,
    starred:
      item.item_type === "file"
        ? Boolean(starredIds?.files.has(item.id))
        : Boolean(starredIds?.folders.has(item.id)),
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
      starred: false,
    })),
    ...files.map((file) => ({
      id: file.id,
      kind: "file" as const,
      name: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      updatedAt: file.updated_at,
      deletedAt: file.deleted_at,
      starred: false,
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
  if (section === "home") {
    return "Home";
  }
  if (section === "starred") {
    return "Starred";
  }
  if (section === "shared") {
    return "Shared";
  }
  if (section === "activity") {
    return "Activity";
  }
  if (section === "trash") {
    return "Trash";
  }
  return "My Drive";
}

function getHeaderBreadcrumbs(section: SectionKey, breadcrumbs: readonly { id: string | null; name: string }[]) {
  if (section === "home") {
    return [{ id: null, name: "Home" }] as const;
  }
  if (section === "starred") {
    return [{ id: null, name: "Starred" }] as const;
  }
  if (section === "shared") {
    return [{ id: null, name: "Shared" }] as const;
  }
  if (section === "activity") {
    return [{ id: null, name: "Activity" }] as const;
  }
  if (section === "trash") {
    return [{ id: null, name: "Trash" }] as const;
  }
  return breadcrumbs;
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

function formatActivityAction(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
