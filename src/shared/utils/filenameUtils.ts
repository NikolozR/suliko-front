/**
 * Utility functions for generating localized filenames
 */

import { useTranslations } from "next-intl";

/**
 * Generate a localized filename based on the original file name
 * @param originalFileName - The original uploaded file name
 * @param fileExtension - The file extension for the download
 * @param translatedSuffix - The localized suffix (e.g., "translated" or "თარგმნილი")
 * @returns Formatted filename with localized suffix
 */
export function generateLocalizedFilename(
  originalFileName: string,
  fileExtension: string,
  translatedSuffix: string
): string {
  // Remove the original file extension
  const nameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, "");
  
  // Add the localized suffix and new extension
  return `${nameWithoutExtension}_${translatedSuffix}.${fileExtension}`;
}

/**
 * Hook to get the translated suffix for the current locale
 * @returns The translated suffix string
 */
export function useTranslatedSuffix() {
  const t = useTranslations("Download");
  return t("translatedSuffix");
}
