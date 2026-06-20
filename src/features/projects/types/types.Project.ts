import { Chat } from "@/features/chatHistory";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";

/** A saved name-rendering pair in a project's consolidated glossary. */
export interface ProjectNameTranslation extends NameTranslationItem {
    id: string;
}

export interface ProjectNamesResponse {
    success: boolean;
    data: ProjectNameTranslation[];
}

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
