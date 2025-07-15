export type ChatStatus = 'Completed' | 'InProgress' | 'Failed';

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

export interface ChatHistoryPaginationParams {
    pageSize?: number;
    pageNumber?: number;
} 