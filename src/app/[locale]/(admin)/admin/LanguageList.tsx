"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/ui";
import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";

interface Language {
  id: number;
  name: string;
  nameGeo: string;
}

export default function LanguageList() {
  const token = useAuthStore((s) => s.token);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const fetchLanguages = async () => {
    if (!token) {
      setError("Missing auth token. Please re-login as admin.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching languages...");
      const response = await fetch(`${API_BASE_URL}/Language`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Languages response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch languages: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Languages data:", data);

      // Handle different response formats
      let languagesList: Language[] = [];
      if (Array.isArray(data)) {
        languagesList = data;
      } else if (data && typeof data === 'object') {
        // Handle case where response might be wrapped in an object
        const items = data.items || data.data || [];
        if (Array.isArray(items)) {
          languagesList = items;
        }
      }

      setLanguages(languagesList);
    } catch (err: unknown) {
      console.error("Language fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch languages");
    } finally {
      setLoading(false);
    }
  };

  const deleteLanguage = async (id: number) => {
    if (!token) {
      setError("Missing auth token. Please re-login as admin.");
      return;
    }

    setDeletingId(id);
    setDeleteMessage(null);
    setError(null);

    try {
      console.log(`Deleting language with ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/Language/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete language: ${response.status} - ${errorText}`);
      }

      // Remove the deleted language from the list
      setLanguages(prev => prev.filter(lang => lang.id !== id));
      setDeleteMessage(`✅ Language with ID ${id} deleted successfully.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setDeleteMessage(null), 3000);

    } catch (err: unknown) {
      console.error("Delete language error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete language");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, [token]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading languages...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
          <button 
            onClick={fetchLanguages}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            🔄 Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>System Languages ({languages.length})</CardTitle>
        {deleteMessage && (
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-green-700 dark:text-green-300 text-sm font-medium">
              {deleteMessage}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {languages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-lg mb-2">📝</div>
            <div>No languages found</div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-300">
              <div>ID</div>
              <div>Name (English)</div>
              <div>Name (Georgian)</div>
              <div>Actions</div>
            </div>
            {/* Rows */}
            {languages.map((language, index) => (
              <div 
                key={language.id} 
                className={`grid grid-cols-4 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 ${
                  index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">{language.id}</div>
                <div className="text-slate-700 dark:text-slate-300">{language.name}</div>
                <div className="text-slate-700 dark:text-slate-300">{language.nameGeo}</div>
                <div className="flex items-center">
                  <button
                    onClick={() => deleteLanguage(language.id)}
                    disabled={deletingId === language.id}
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors duration-200 ${
                      deletingId === language.id
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={`Delete ${language.name}`}
                  >
                    {deletingId === language.id ? '⏳' : '🗑️'} {deletingId === language.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={fetchLanguages}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
