'use client';
import {
  Check,
  ChevronRight,
  CopyMinus,
  FilePlus,
  Folder,
  FolderInput,
  FolderPlus,
  type LucideIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Square,
  SquareCheck,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/cn';
import {
  baseName,
  EXTENSION,
  folderIcon,
  isFixed,
  isInside,
  MANIFEST,
  MODULE_PATH,
  parentOf,
  pathIn,
  plannedMoves,
  SOURCE,
  STARTING_FOLDER_ICONS,
  topMost,
} from '@/lib/file-paths';

const OPEN_ON_DRAG_MS = 600; // a shut folder opens when something is held over it
const DRAG_TYPE = 'application/x-peeper-paths'; // not text, which the editor would paste

interface Row {
  path: string;
  depth: number;
  folder: boolean;
}

/** The menu that is open: on `paths`, with new things going in `folder`. */
interface OpenMenu {
  x: number;
  y: number;
  paths: string[];
  folder: string;
  arming?: boolean; // the next press of Delete deletes
  choosingFolder?: boolean;
}

/** The name being typed, shown in `parent`: of a new file or folder, or for `renaming`. */
interface Naming {
  parent: string;
  folder: boolean;
  renaming?: string;
}

/** The project folder, then in each folder its folders and files, and nothing in a shut one. */
function visibleRows(names: string[], folders: string[], shut: string[]) {
  const rows: Row[] = [{ path: '', depth: 0, folder: true }]; // the project folder
  function addFolder(parent: string, depth: number) {
    for (const path of folders) {
      if (parentOf(path) !== parent) continue;
      rows.push({ path, depth, folder: true });
      if (!shut.includes(path)) addFolder(path, depth + 1);
    }
    for (const path of names) {
      if (parentOf(path) === parent) rows.push({ path, depth, folder: false });
    }
  }
  if (!shut.includes('')) addFolder('', 1);
  return rows;
}

/** A name being typed: Enter or leaving keeps a usable one, Escape drops it. */
function NameInput({
  initial,
  depth,
  usable,
  onDone,
  onCancel,
}: {
  initial: string;
  depth: number;
  usable: (name: string) => boolean;
  onDone: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  const dropped = useRef(false);
  const typed = name.replace(EXTENSION, '');
  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: it opens because the person asked to type here
      autoFocus
      aria-label="Name"
      aria-invalid={name !== '' && !usable(typed)}
      spellCheck={false}
      value={name}
      onChange={(event) => setName(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={() => (!dropped.current && usable(typed) ? onDone(typed) : onCancel())}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          dropped.current = true;
          event.currentTarget.blur();
        }
        if (event.key === 'Enter') {
          event.preventDefault(); // or the key lands in the editor that takes focus
          if (usable(typed)) event.currentTarget.blur();
        }
      }}
      style={{ marginLeft: depth * 12, width: `calc(100% - ${depth * 12 + 4}px)` }}
      className="my-0.5 min-w-0 rounded border bg-transparent px-1.5 py-0.5 text-fd-foreground outline-none focus:border-brand aria-invalid:border-red-500 max-md:py-2"
    />
  );
}

function MenuItem({
  icon: Icon,
  label,
  disabled,
  title,
  danger,
  className,
  onChoose,
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
  className?: string;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onChoose}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left outline-none hover:bg-fd-accent focus-visible:bg-fd-accent disabled:opacity-40 max-md:py-3',
        danger && 'text-red-500',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** A menu at a place on a large screen, and along the bottom edge on a phone. */
function ActionMenu({
  x,
  y,
  label,
  onClose,
  children,
}: {
  x: number;
  y: number;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = menu.current;
    if (!element) return;
    element.showPopover();
    const { width, height } = element.getBoundingClientRect();
    element.style.setProperty('--menu-x', `${Math.min(x, innerWidth - width - 8)}px`);
    element.style.setProperty('--menu-y', `${Math.min(y, innerHeight - height - 8)}px`);
    element.querySelector<HTMLButtonElement>('button:enabled')?.focus();
  }, [x, y]);

  function moveFocus(event: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const items = [...(menu.current?.querySelectorAll('button:enabled') ?? [])] as HTMLElement[];
    const now = items.indexOf(document.activeElement as HTMLElement);
    items[(now + step + items.length) % items.length]?.focus();
  }

  return (
    <div
      ref={menu}
      popover="auto"
      role="menu"
      aria-label={label}
      onToggle={(event) => {
        if (event.newState === 'closed') onClose();
      }}
      onKeyDown={moveFocus}
      className="fixed m-0 max-h-[70dvh] overflow-auto rounded-lg border bg-fd-popover p-1 font-sans text-xs text-fd-popover-foreground shadow-xl shadow-black/30 max-md:inset-x-2 max-md:top-auto max-md:bottom-2 max-md:w-auto max-md:text-sm md:top-(--menu-y) md:left-(--menu-x) md:w-52"
    >
      {children}
    </div>
  );
}

/** The picture of a row, which the row's name already says for a screen reader. */
function RowIcon({ src, className }: { src: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={16}
      height={16}
      loading="eager"
      className={cn('shrink-0', className)}
    />
  );
}

/** Komma's two TOML icons in one, as the T must change with the site's light or dark mode. */
function TomlIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="ml-4 size-4 shrink-0">
      <path className="fill-[#455a64] dark:fill-[#cfd8dc]" d="M4 6V4h8v2H9v7H7V6z" />
      <path fill="#ef5350" d="M4 1v1H2v12h2v1H1V1zm8 0v1h2v12h-2v1h3V1z" />
    </svg>
  );
}

/**
 * The program's files by folder. On a large screen it stays beside the code, with a right-click
 * menu, dragging and Ctrl or Shift to select. A phone has none of those, so it opens over the code
 * when `browsing`, with a menu on each row and a mode for selecting.
 */
export function FileTree({
  project,
  names,
  folders,
  active,
  browsing,
  onOpen,
  onCreateFile,
  onCreateFolder,
  onMove,
  onDelete,
  onStopBrowsing,
}: {
  project: string; // the name the project folder shows
  names: string[]; // sorted
  folders: string[]; // sorted, and all of them
  active: string;
  browsing: boolean;
  onOpen: (file: string) => void;
  onCreateFile: (file: string) => void;
  onCreateFolder: (folder: string) => void;
  onMove: (moves: Map<string, string>) => void;
  onDelete: (paths: string[]) => void;
  onStopBrowsing: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [shut, setShut] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false); // a phone's way to choose several
  const [menu, setMenu] = useState<OpenMenu>();
  const [naming, setNaming] = useState<Naming>();
  const [dropFolder, setDropFolder] = useState<string>();
  const [folderIcons, setFolderIcons] = useState(STARTING_FOLDER_ICONS);
  const [refused, setRefused] = useState<string>(); // why this can't be dropped here
  const selectedFrom = useRef<string>(undefined); // where a Shift range starts
  const dragged = useRef<string[]>([]);
  const openOnDrag = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rows = visibleRows(names, folders, shut);

  useEffect(() => {
    fetch('/file-icons/names.json')
      .then((reply) => reply.json())
      .then((icons) => setFolderIcons(new Map(Object.entries(icons))))
      .catch(() => {}); // only a picture: folders stay plain
  }, []);

  function plan(paths: string[], folder: string) {
    const moves = topMost(paths).map((path): [string, string] => [
      path,
      pathIn(folder, baseName(path)),
    ]);
    return plannedMoves(names, folders, moves);
  }

  function applyMoves(moves: Map<string, string>) {
    onMove(moves);
    setSelected(selected.map((path) => moves.get(path) ?? path));
    setShut(shut.map((path) => moves.get(path) ?? path));
  }

  function startNaming(next: Naming) {
    const parent = next.parent || SOURCE; // only `SOURCE` holds modules
    setShut(shut.filter((path) => path && path !== parent && !isInside(parent, path)));
    setNaming({ ...next, parent });
  }

  function pressRow(event: MouseEvent | KeyboardEvent, { path, folder }: Row) {
    if (selecting || event.ctrlKey || event.metaKey) {
      const chosen = selected.includes(path);
      setSelected(chosen ? selected.filter((one) => one !== path) : [...selected, path]);
      selectedFrom.current = path;
      return;
    }
    const from = rows.findIndex((row) => row.path === selectedFrom.current);
    if (event.shiftKey && from >= 0) {
      const to = rows.findIndex((row) => row.path === path);
      const range = rows.slice(Math.min(from, to), Math.max(from, to) + 1);
      setSelected(range.map((row) => row.path));
      return;
    }
    setSelected([path]);
    selectedFrom.current = path;
    if (!folder) {
      onOpen(path);
      onStopBrowsing();
    } else {
      setShut(shut.includes(path) ? shut.filter((one) => one !== path) : [...shut, path]);
    }
  }

  /** The menu for `row`, which covers all that is selected if `row` is among it. */
  function openRowMenu(x: number, y: number, row: Row, arming?: boolean) {
    const paths = selected.includes(row.path) ? selected : [row.path];
    setSelected(paths);
    const folder = row.folder ? row.path : parentOf(row.path);
    setMenu({ x, y, paths, folder, arming });
  }

  function pressRowKey(event: KeyboardEvent<HTMLDivElement>, row: Row) {
    const element = event.currentTarget;
    const { top, left } = element.getBoundingClientRect();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pressRow(event, row);
    } else if (event.key === 'F2' && !isFixed(row.path)) {
      startNaming({ parent: parentOf(row.path), folder: row.folder, renaming: row.path });
    } else if (event.key === 'Delete') {
      openRowMenu(left, top, row, true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const items = [...document.querySelectorAll<HTMLElement>('[role=treeitem]')].filter(
        (item) => item.offsetParent,
      );
      items[items.indexOf(element) + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
    } else if (row.folder && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      const others = shut.filter((one) => one !== row.path);
      setShut(event.key === 'ArrowLeft' ? [...others, row.path] : others);
    }
  }

  function startDrag(event: DragEvent, path: string) {
    const paths = selected.includes(path) ? selected : [path];
    setSelected(paths);
    dragged.current = paths;
    event.dataTransfer.setData(DRAG_TYPE, paths.join('\n'));
    event.dataTransfer.effectAllowed = 'move';
  }

  function endDrag() {
    dragged.current = [];
    clearTimeout(openOnDrag.current);
    setDropFolder(undefined);
    setRefused(undefined);
  }

  function dropFolderOf(event: DragEvent) {
    const row = (event.target as Element).closest('[data-drop]');
    return row?.getAttribute('data-drop') || SOURCE;
  }

  function dragOver(event: DragEvent) {
    if (!dragged.current.length) return; // not ours, like a file from the desktop
    const folder = dropFolderOf(event);
    const planned = plan(dragged.current, folder);
    const usable = typeof planned !== 'string' && planned.size > 0;
    if (usable) event.preventDefault();
    event.dataTransfer.dropEffect = usable ? 'move' : 'none';
    setRefused(typeof planned === 'string' ? planned : undefined);
    if (folder === dropFolder) return;
    setDropFolder(folder);
    clearTimeout(openOnDrag.current);
    if (shut.includes(folder)) {
      openOnDrag.current = setTimeout(
        () => setShut((now) => now.filter((one) => one !== folder)),
        OPEN_ON_DRAG_MS,
      );
    }
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    const planned = plan(dragged.current, dropFolderOf(event));
    if (typeof planned !== 'string') applyMoves(planned);
    endDrag();
  }

  function namingRow(depth: number) {
    if (!naming) return null;
    const { parent, folder, renaming } = naming;
    const finish = (name: string) => (folder ? name : `${name}${EXTENSION}`);
    const target = (name: string) => pathIn(parent, finish(name));
    const initial = renaming ? baseName(renaming).replace(EXTENSION, '') : '';
    const usable = (name: string) => {
      if (!MODULE_PATH.test(pathIn(parent, name))) return false;
      const path = target(name);
      if (renaming) return typeof plannedMoves(names, folders, [[renaming, path]]) !== 'string';
      return !names.includes(path) && !folders.includes(path);
    };
    return (
      <NameInput
        key="naming"
        initial={initial}
        depth={depth}
        usable={usable}
        onCancel={() => setNaming(undefined)}
        onDone={(name) => {
          setNaming(undefined);
          const path = target(name);
          if (renaming) {
            const planned = plannedMoves(names, folders, [[renaming, path]]);
            if (typeof planned !== 'string') applyMoves(planned);
          } else if (folder) {
            onCreateFolder(path);
          } else {
            onCreateFile(path);
          }
        }}
      />
    );
  }

  function menuContents(open: OpenMenu) {
    const { paths, folder, arming, choosingFolder } = open;
    const close = () => setMenu(undefined);
    const removable = paths.filter((path) => !isFixed(path));
    if (choosingFolder) {
      return folders.map((target) => {
        const planned = plan(paths, target);
        return (
          <MenuItem
            key={target}
            icon={Folder}
            label={`${target}/`}
            disabled={typeof planned === 'string' || planned.size === 0}
            title={typeof planned === 'string' ? planned : undefined}
            onChoose={() => {
              if (typeof planned !== 'string') applyMoves(planned);
              close();
            }}
          />
        );
      });
    }
    const makesNew = paths.length < 2;
    return (
      <>
        {makesNew && (
          <>
            <MenuItem
              icon={FilePlus}
              label="New file"
              onChoose={() => {
                startNaming({ parent: folder, folder: false });
                close();
              }}
            />
            <MenuItem
              icon={FolderPlus}
              label="New folder"
              onChoose={() => {
                startNaming({ parent: folder, folder: true });
                close();
              }}
            />
          </>
        )}
        {paths.length === 1 && !isFixed(paths[0]) && (
          <MenuItem
            icon={Pencil}
            label="Rename"
            onChoose={() => {
              const [path] = paths;
              startNaming({
                parent: parentOf(path),
                folder: folders.includes(path),
                renaming: path,
              });
              close();
            }}
          />
        )}
        {removable.length > 0 && (
          <>
            <MenuItem
              icon={FolderInput}
              label="Move to…"
              onChoose={() => setMenu({ ...open, choosingFolder: true })}
            />
            <MenuItem
              icon={Trash2}
              danger
              label={
                arming
                  ? `Really delete ${removable.length === 1 ? baseName(removable[0]) : `${removable.length} items`}`
                  : 'Delete'
              }
              onChoose={() => {
                if (!arming) {
                  setMenu({ ...open, arming: true });
                  return;
                }
                onDelete(removable);
                setSelected([]);
                close();
              }}
            />
          </>
        )}
        {paths.length === 0 && (
          <MenuItem
            icon={CopyMinus}
            label="Collapse all folders"
            disabled={folders.length === 0}
            onChoose={() => {
              setShut(folders);
              close();
            }}
          />
        )}
        <MenuItem
          icon={SquareCheck}
          label="Select several"
          className="md:hidden"
          onChoose={() => {
            setSelecting(true);
            close();
          }}
        />
      </>
    );
  }

  return (
    <div
      className={cn(
        'w-48 shrink-0 flex-col border-r font-mono text-xs text-fd-muted-foreground md:flex',
        browsing ? 'flex max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-auto' : 'hidden',
        'bg-fd-card max-md:text-sm',
      )}
    >
      <div className="flex items-center gap-1 border-b px-3 py-1.5 md:hidden">
        <span className="font-sans font-medium">Files</span>
        <button
          type="button"
          aria-label="New file or folder"
          onClick={() => setMenu({ x: 0, y: 0, paths: [], folder: '' })}
          className="ml-auto rounded-full p-2 hover:bg-fd-accent"
        >
          <Plus aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Close files"
          onClick={() => {
            setSelecting(false);
            onStopBrowsing();
          }}
          className="rounded-full p-2 hover:bg-fd-accent"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: each row takes the keys */}
      <div
        role="tree"
        aria-label="Files"
        aria-multiselectable
        tabIndex={-1}
        onClick={() => setSelected([])}
        onContextMenu={(event) => {
          event.preventDefault();
          setSelected([]);
          setMenu({ x: event.clientX, y: event.clientY, paths: [], folder: '' });
        }}
        onDragOver={dragOver}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropFolder(undefined);
        }}
        onDrop={drop}
        className="min-h-0 flex-1 overflow-auto rounded p-2 outline-none"
      >
        {rows.flatMap((row) => {
          const { path, depth, folder } = row;
          const isShut = shut.includes(path);
          const isRenaming = naming?.renaming === path;
          const inDrop = dropFolder && (path === dropFolder || isInside(path, dropFolder));
          const rowItem = (
            <div
              key={path}
              className={cn(
                'flex items-center rounded',
                selected.includes(path) ? 'bg-fd-accent' : 'hover:bg-fd-accent/60',
                inDrop && 'bg-brand/10',
              )}
            >
              {isRenaming ? (
                namingRow(depth)
              ) : (
                <div
                  role="treeitem"
                  tabIndex={0}
                  title={path || project}
                  style={{ paddingLeft: 4 + depth * 12 }}
                  data-drop={folder ? path : parentOf(path)}
                  aria-selected={selected.includes(path)}
                  aria-expanded={folder ? !isShut : undefined}
                  aria-current={path === active}
                  draggable={!isFixed(path)}
                  onDragStart={(event) => startDrag(event, path)}
                  onDragEnd={endDrag}
                  onClick={(event) => {
                    event.stopPropagation();
                    pressRow(event, row);
                  }}
                  onKeyDown={(event) => pressRowKey(event, row)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openRowMenu(event.clientX, event.clientY, row);
                  }}
                  className={cn(
                    'flex min-w-0 flex-1 cursor-pointer select-none items-center gap-1.5 rounded py-1 pr-1 outline-none focus-visible:ring-1 focus-visible:ring-brand max-md:py-2.5',
                    path === active && 'text-brand',
                  )}
                >
                  {selecting &&
                    (selected.includes(path) ? (
                      <Check aria-hidden className="size-4 shrink-0" />
                    ) : (
                      <Square aria-hidden className="size-4 shrink-0" />
                    ))}
                  {folder ? (
                    <>
                      <ChevronRight
                        aria-hidden
                        className={cn('size-3 shrink-0 transition', !isShut && 'rotate-90')}
                      />
                      <RowIcon src={folderIcon(path, isShut, folderIcons)} />
                    </>
                  ) : path === MANIFEST ? (
                    <TomlIcon />
                  ) : (
                    <RowIcon src="/icon.svg" className="ml-4" />
                  )}
                  <span className="truncate">{path ? baseName(path) : project}</span>
                </div>
              )}
              <button
                type="button"
                aria-label={`Actions for ${path || project}`}
                onClick={(event) => {
                  event.stopPropagation();
                  openRowMenu(0, 0, row);
                }}
                className="shrink-0 rounded-full p-2 md:hidden"
              >
                <MoreHorizontal aria-hidden className="size-4" />
              </button>
            </div>
          );
          return naming?.parent === path && folder && !naming.renaming
            ? [rowItem, <div key="new-in-folder">{namingRow(depth + 1)}</div>]
            : [rowItem];
        })}
      </div>
      {refused && <p className="border-t px-2 py-1.5 font-sans text-red-500">{refused}</p>}
      {selecting && (
        <div className="flex items-center gap-2 border-t px-3 py-2 font-sans">
          <span>{selected.length} selected</span>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => setMenu({ x: 0, y: 0, paths: selected, folder: '' })}
            className="ml-auto rounded-full border px-3 py-1.5 disabled:opacity-40"
          >
            Actions
          </button>
          <button
            type="button"
            onClick={() => {
              setSelecting(false);
              setSelected([]);
            }}
            className="rounded-full border px-3 py-1.5"
          >
            Done
          </button>
        </div>
      )}
      {menu && (
        <ActionMenu
          key={`${menu.x},${menu.y},${menu.choosingFolder}`}
          x={menu.x}
          y={menu.y}
          label="File actions"
          onClose={() => setMenu(undefined)}
        >
          {menuContents(menu)}
        </ActionMenu>
      )}
    </div>
  );
}
