import { useAuthStore } from '../store/authStore'; // Assuming store is at src/store/authStore.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface TranslateUserContentParams {
  description: string;
  LanguageId: number;
  SourceLanguageId: number;
  Files: File[];
  IsPdf: boolean;
}

export const translateUserContent = async (params: TranslateUserContentParams) => {
  const formData = new FormData();

  formData.append('description', params.description);
  formData.append('LanguageId', params.LanguageId.toString());
  formData.append('SourceLanguageId', params.SourceLanguageId.toString());
  params.Files.forEach((file) => {
    formData.append('Files', file);
  });
  formData.append('IsPdf', params.IsPdf.toString());

  const endpoint = '/UserContent/translate';
  const token = useAuthStore.getState().token;

  const headers = new Headers();
  // FormData sets Content-Type to multipart/form-data automatically, so we don't set it manually.
  // However, if you were sending JSON, you would do:
  // headers.append('Content-Type', 'application/json'); 
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers, // Add the headers object here
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData) || errorMessage;
      } catch {
        try {
          const textError = await response.text();
          errorMessage = textError || errorMessage; 
        } catch {
          console.error('Error occurred while parsing error response:', errorMessage);
        }
      }
      console.error('Translation API Error:', errorMessage);
      throw new Error(errorMessage);
    }
    console.log(await response.json());
    return await response.json();
  } catch (error) {
    console.error('Network or other error in translateUserContent:', error);
    if (error instanceof Error) {
      throw error; 
    } else {
      throw new Error(String(error));
    }
  }
};
