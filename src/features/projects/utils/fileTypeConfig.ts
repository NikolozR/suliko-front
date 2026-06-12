import { FileText, Image, FileSpreadsheet, FileIcon } from "lucide-react";

export const FILE_TYPE_CONFIG: Record<string, { icon: typeof FileIcon; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
  docx: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  doc: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  txt: { icon: FileText, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/40" },
  xlsx: { icon: FileSpreadsheet, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
  xls: { icon: FileSpreadsheet, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
  png: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  jpg: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  jpeg: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
};

export function getFileConfig(fileType: string) {
  return FILE_TYPE_CONFIG[fileType?.toLowerCase()] ?? { icon: FileIcon, color: "text-muted-foreground", bg: "bg-muted" };
}

export function getStatusStyle(status: string, hasError: boolean) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40";
  if (hasError || status === "Failed") return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200/60 dark:border-red-800/40";
  return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40";
}
