import { Suggestion } from "@/features/translation";

export type ChatStatus = 'Completed' | 'InProgress' | 'Failed' | 'Queued';

export interface Chat {
    chatId: string;
    title: string;
    originalFileName: string;
    fileType: string;
    targetLanguageName: string;
    status: ChatStatus;
    createdAt: string;
    lastActivityAt: string;
    hasResult: boolean;
    hasError: boolean;
}

export interface ChatDetailed {
    chatId: string;
    jobId: string;
    title: string;
    originalFileName: string;
    fileType: string;
    targetLanguageName: string;
    sourceLanguageName?: string;
    status: ChatStatus;
    createdAt: string;
    lastActivityAt: string;
    translationResult?: ChatTrnalsationResult;
    fileSizeKB?: number;
    pageCount?: number;
    estimatedWordCount?: number;
    estimatedTimeMinutes?: number;
}

export interface ChatTrnalsationResult {
    contentType: string;
    cost: number;
    errorMessage: string | null;
    fileData: string; 
    fileName: string; 
    originalContent: null;
    outputFormat: number;
    success: boolean;
    suggestions: Suggestion[];
    translatedContent: string;
    translationId: string; 
    translationQualityScore: number;
}

export interface ChatHistoryResponse {
    success: boolean;
    data: {
        chats: Chat[];
        totalCount: number;
        pageSize: number;
        pageNumber: number;
        hasNextPage: boolean;
    };
}

export interface SingleChatHistoryResponse {
    success: boolean;
    data: ChatDetailed;
}

export interface ChatHistoryPaginationParams {
    pageSize?: number;
    pageNumber?: number;
} 