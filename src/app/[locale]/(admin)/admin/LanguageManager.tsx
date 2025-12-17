"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/features/ui";
import { API_BASE_URL } from "@/shared/constants/api";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function LanguageManager() {
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState("");
  const [nameGeo, setNameGeo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setTestResult(null);
    if (!token) {
      setError("Missing auth token. Please re-login as admin.");
      return;
    }
    if (!name.trim() || !nameGeo.trim()) {
      setError("Name and Georgian name are required.");
      return;
    }
    setLoading(true);
    try {
      // Step 1: GET existing languages to find the highest ID
      console.log("Step 1: Fetching existing languages...");
      const getRes = await fetch(`${API_BASE_URL}/Language`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("GET response status:", getRes.status);
      
      if (!getRes.ok) {
        const errorText = await getRes.text();
        throw new Error(`Failed to fetch existing languages: ${getRes.status} - ${errorText}`);
      }
      
      const existingLanguages = await getRes.json();
      console.log("Existing languages:", existingLanguages);
      
      // Find the highest ID
      let maxId = 0;
      if (Array.isArray(existingLanguages)) {
        maxId = Math.max(...existingLanguages.map((lang: { id?: number }) => lang.id || 0));
      } else if (existingLanguages && typeof existingLanguages === 'object') {
        // Handle case where response might be wrapped in an object
        const items = existingLanguages.items || existingLanguages.data || [];
        if (Array.isArray(items)) {
          maxId = Math.max(...items.map((lang: { id?: number }) => lang.id || 0));
        }
      }
      
      const newId = maxId + 1;
      console.log(`Step 2: Using ID ${newId} (max existing ID: ${maxId})`);
      
      // Step 2: PUT with the new ID
      const requestBody = {
        id: newId,
        name: name.trim(),
        nameGeo: nameGeo.trim()
      };
      
      console.log("Request body:", requestBody);
      console.log("API URL:", `${API_BASE_URL}/Language`);
      console.log("Token:", token ? "Present" : "Missing");
      
      // Try different request formats
      let response;
      let lastError;
      
      // Format 1: Standard format
      try {
        response = await fetch(`${API_BASE_URL}/Language`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        console.log("POST response status:", response.status);
        
        if (response.ok) {
          console.log("POST succeeded");
        } else {
          throw new Error(`POST failed: ${response.status}`);
        }
      } catch (err) {
        console.log("POST failed, trying PUT...");
        lastError = err;
        
        try {
          response = await fetch(`${API_BASE_URL}/Language`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });
          console.log("PUT response status:", response.status);
          
          if (response.ok) {
            console.log("PUT succeeded");
          } else {
            throw new Error(`PUT failed: ${response.status}`);
          }
        } catch (putErr) {
          console.log("PUT failed, trying alternative field names...");
          lastError = putErr;
          
          // Try alternative field names
          const altRequestBody = {
            Id: newId,
            Name: name.trim(),
            NameGeo: nameGeo.trim()
          };
          
          response = await fetch(`${API_BASE_URL}/Language`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(altRequestBody),
          });
          console.log("Alternative POST response status:", response.status);
        }
      }
      
      if (!response || !response.ok) {
        const errorText = response ? await response.text() : "No response received";
        console.error("Error response:", errorText);
        console.error("Last error:", lastError);
        throw new Error(`Failed to save language: ${response?.status || 'No response'} - ${errorText}`);
      }
      
      // Handle response parsing safely
      let responseData;
      try {
        const responseText = await response.text();
        console.log("Raw response text:", responseText);
        
        if (responseText.trim()) {
          responseData = JSON.parse(responseText);
          console.log("Parsed response data:", responseData);
        } else {
          console.log("Empty response received");
          responseData = { success: true, message: "Language saved successfully" };
        }
      } catch (parseError) {
        console.log("JSON parse error, treating as success:", parseError);
        responseData = { success: true, message: "Language saved successfully (non-JSON response)" };
      }
      
      setMessage(`Language saved successfully with ID ${newId}.`);
      setName("");
      setNameGeo("");
      
    } catch (err: unknown) {
      console.error("Language save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save language");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Add / Update Language</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Specify the English name and Georgian name for the language. ID will be automatically assigned.
        </p>
        <div className="mt-2">
          <button 
            type="button"
            onClick={async () => {
              setTestResult("Testing API connection...");
              console.log("Testing API connection...");
              try {
                const testResponse = await fetch(`${API_BASE_URL}/Language`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                console.log("GET test response:", testResponse.status);
                const testData = await testResponse.text();
                console.log("GET test data:", testData);
                
                if (testResponse.ok) {
                  setTestResult(`✅ API Connection Successful! Status: ${testResponse.status} - Data: ${testData.substring(0, 100)}${testData.length > 100 ? '...' : ''}`);
                } else {
                  setTestResult(`❌ API Connection Failed! Status: ${testResponse.status} - ${testData}`);
                }
              } catch (err) {
                console.error("GET test error:", err);
                setTestResult(`❌ API Connection Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            🔍 Test API Connection
          </button>
          {testResult && (
            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {testResult}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (EN)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. English" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameGeo">Name (KA)</Label>
              <Input id="nameGeo" value={nameGeo} onChange={(e) => setNameGeo(e.target.value)} placeholder="e.g. ინგლისური" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Language"}
            </Button>
            {message && <span className="text-green-600 text-sm">{message}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


