import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared/constants/api";

export type ConversionType = "markdown-to-pdf" | "pdf-to-word" | "word-to-pdf";

export type FileType = "markdown" | "pdf" | "docx" | "txt";

function getFileType(file: File): FileType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  switch (extension) {
    case "md":
    case "markdown":
      return "markdown";
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    default:
      throw new Error(`Unsupported file type: ${extension || mimeType}`);
  }
}

function getConversionType(
  sourceType: FileType,
  targetType: FileType
): ConversionType {
  const conversion = `${sourceType}-to-${targetType}` as ConversionType;

  const supportedConversions: ConversionType[] = [
    "markdown-to-pdf",
    "pdf-to-word",
    "word-to-pdf",
  ];

  if (!supportedConversions.includes(conversion)) {
    throw new Error(
      `Conversion from ${sourceType} to ${targetType} is not supported`
    );
  }

  return conversion;
}

async function convertFile(
  file: File,
  targetType: FileType,
  conversionType?: ConversionType
): Promise<Blob> {
  const sourceType = getFileType(file);
  const conversion =
    conversionType || getConversionType(sourceType, targetType);

  const getEndpoint = (type: ConversionType): string => {
    switch (type) {
      case "markdown-to-pdf":
        return "/Document/convert/markdown-to-pdf";
      case "pdf-to-word":
        return "/Document/convert/pdf-to-word";
      case "word-to-pdf":
        return "/Document/convert/word-to-pdf";
      default:
        throw new Error(`Endpoint not defined for conversion type: ${type}`);
    }
  };

  const endpoint = getEndpoint(conversion);
  const formData = new FormData();
  formData.append("File", file);

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to convert ${sourceType} to ${targetType}`);
  }

  const data = await response.blob();
  return data;
}

export async function markdownToPdf(markdown: File): Promise<Blob> {
  return convertFile(markdown, "pdf", "markdown-to-pdf");
}

export async function pdfToWord(pdf: File): Promise<Blob> {
  return convertFile(pdf, "docx", "pdf-to-word");
}

export async function wordToPdf(word: File): Promise<Blob> {
  return convertFile(word, "pdf", "word-to-pdf");
}

/**
 * Converts a document to HTML using OCR
 * @param file - The document file to OCR
 * @returns The OCR'd HTML content as a string
 */
export async function ocrToHtml(file: File): Promise<string> {
  const endpoint = "/Document/convert/ocr-to-html";
  const formData = new FormData();
  formData.append("File", file);

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status < 200 || response.status >= 300) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to OCR document: ${errorText}`);
  }

  const htmlContent = await response.text();
  return htmlContent;
}