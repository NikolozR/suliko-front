import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Language {
    id: number;
    name: string;
    nameGeo: string;
}

export async function getAllLanguages() {
  const endpoint = '/Language';
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error('Failed to fetch languages');
  }
  const data = await response.json();
  console.log(data);
  return data;
}