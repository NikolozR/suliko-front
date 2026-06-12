import { Chat } from "@/features/chatHistory";

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    translationCount: number;
}

export interface ProjectDetailed {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    translations: Chat[];
}

export interface ProjectsResponse {
    success: boolean;
    data: Project[];
}

export interface ProjectResponse {
    success: boolean;
    data: Project;
}

export interface ProjectDetailedResponse {
    success: boolean;
    data: ProjectDetailed;
}
