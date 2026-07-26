/**
 * Turning a dropped or picked folder into a flat list of translatable documents.
 *
 * Two entry points exist because the browser exposes folders two different ways: a file input
 * with `webkitdirectory` yields a flat FileList carrying `webkitRelativePath`, while a drag-drop
 * yields a tree that has to be walked.
 */

/** Extensions the document pipeline can translate through the Gemini Files API path. */
const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".md",
  ".markdown",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

/**
 * Subtitles are deliberately excluded. They have their own backend path that preserves
 * sequence numbers and timestamps; running them through the generic document translator
 * would return prose and silently destroy the timing structure.
 */
const EXCLUDED_EXTENSIONS = [".srt"] as const;

/** Matches the per-file cap the single-document upload form enforces. */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".md": "text/plain",
  ".markdown": "text/plain",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export interface ScannedFile {
  file: File;
  relativePath: string;
}

export interface FolderScanResult {
  accepted: ScannedFile[];
  /** Files left out, with a reason to show the user rather than dropping them silently. */
  rejected: Array<{ name: string; relativePath: string; reason: RejectionReason }>;
}

export type RejectionReason = "unsupported" | "subtitles" | "too-large" | "empty";

export const getExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
};

export const isSupportedFile = (fileName: string): boolean =>
  (SUPPORTED_EXTENSIONS as readonly string[]).includes(getExtension(fileName));

/**
 * Browsers leave `File.type` empty for some sources (notably drag-drop on Linux and any
 * extension the OS doesn't recognise), and Gemini rejects an upload with no MIME type, so
 * fall back to mapping from the extension.
 */
export const resolveMimeType = (file: File): string =>
  file.type || MIME_TYPES[getExtension(file.name)] || "application/octet-stream";

/**
 * Files the OS or archive tools scatter through folders that are never user content.
 * Without this a single dropped folder can arrive with dozens of junk entries.
 */
const isJunkPath = (relativePath: string): boolean => {
  const segments = relativePath.split("/");
  return segments.some(
    (segment) =>
      segment.startsWith(".") ||
      segment === "__MACOSX" ||
      segment === "Thumbs.db" ||
      segment === "desktop.ini"
  );
};

const classify = (file: File, relativePath: string): RejectionReason | null => {
  if (isJunkPath(relativePath)) return "unsupported";
  if ((EXCLUDED_EXTENSIONS as readonly string[]).includes(getExtension(file.name)))
    return "subtitles";
  if (!isSupportedFile(file.name)) return "unsupported";
  if (file.size === 0) return "empty";
  if (file.size > MAX_FILE_SIZE_BYTES) return "too-large";
  return null;
};

const partition = (scanned: ScannedFile[]): FolderScanResult => {
  const accepted: ScannedFile[] = [];
  const rejected: FolderScanResult["rejected"] = [];

  for (const entry of scanned) {
    const reason = classify(entry.file, entry.relativePath);
    if (reason) {
      // Junk files are noise, not something the user chose to include, so they are
      // dropped entirely rather than reported.
      if (!isJunkPath(entry.relativePath)) {
        rejected.push({
          name: entry.file.name,
          relativePath: entry.relativePath,
          reason,
        });
      }
      continue;
    }
    accepted.push(entry);
  }

  // Folder order from the filesystem is arbitrary; sorting by path keeps the list stable
  // and groups each subfolder's documents together.
  accepted.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return { accepted, rejected };
};

/** Handles the `<input type="file" webkitdirectory>` case. */
export const scanFileList = (fileList: FileList): FolderScanResult => {
  const scanned: ScannedFile[] = Array.from(fileList).map((file) => ({
    file,
    // webkitRelativePath is empty when individual files were picked rather than a folder.
    relativePath:
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name,
  }));

  return partition(scanned);
};

interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (cb: (file: File) => void, err: (e: unknown) => void) => void;
  createReader?: () => {
    readEntries: (
      cb: (entries: FileSystemEntryLike[]) => void,
      err: (e: unknown) => void
    ) => void;
  };
}

const readEntryFile = (entry: FileSystemEntryLike): Promise<File | null> =>
  new Promise((resolve) => {
    entry.file?.(
      (file) => resolve(file),
      () => resolve(null)
    );
  });

/**
 * Reads one directory completely.
 *
 * `readEntries` returns at most 100 entries per call and signals the end with an empty
 * batch, so a single call silently truncates any folder with more than 100 items — which is
 * exactly the size of folder this feature exists to handle.
 */
const readAllEntries = async (
  entry: FileSystemEntryLike
): Promise<FileSystemEntryLike[]> => {
  const reader = entry.createReader?.();
  if (!reader) return [];

  const all: FileSystemEntryLike[] = [];

  for (;;) {
    const batch = await new Promise<FileSystemEntryLike[]>((resolve) => {
      reader.readEntries(
        (entries) => resolve(entries),
        () => resolve([])
      );
    });

    if (batch.length === 0) break;
    all.push(...batch);
  }

  return all;
};

const walkEntry = async (
  entry: FileSystemEntryLike,
  parentPath: string,
  collected: ScannedFile[]
): Promise<void> => {
  const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await readEntryFile(entry);
    if (file) collected.push({ file, relativePath: path });
    return;
  }

  if (entry.isDirectory) {
    const children = await readAllEntries(entry);
    // Sequential rather than parallel: a deep folder tree can otherwise open hundreds of
    // concurrent directory readers, which browsers throttle unpredictably.
    for (const child of children) {
      await walkEntry(child, path, collected);
    }
  }
};

/** Handles a dropped folder, walking the directory tree the browser exposes. */
export const scanDataTransfer = async (
  dataTransfer: DataTransfer
): Promise<FolderScanResult> => {
  // DataTransferItemList is emptied as soon as the event handler yields, so every entry
  // must be taken synchronously, before the first await.
  const entries: FileSystemEntryLike[] = [];
  for (const item of Array.from(dataTransfer.items)) {
    const entry = (
      item as DataTransferItem & {
        webkitGetAsEntry?: () => FileSystemEntryLike | null;
      }
    ).webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }

  // Browsers without the entry API still deliver a flat file list.
  if (entries.length === 0) return scanFileList(dataTransfer.files);

  const collected: ScannedFile[] = [];
  for (const entry of entries) {
    await walkEntry(entry, "", collected);
  }

  return partition(collected);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
