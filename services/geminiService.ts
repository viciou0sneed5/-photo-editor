
// This service now calls your own backend, which will then securely call the Google Gemini API.
// This is essential for protecting your API_KEY.

interface ApiOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

// Helper to get the auth token from localStorage
const getAuthToken = (): string | null => {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser).token;
    }
    return null;
  } catch {
    return null;
  }
};

const apiFetch = async (endpoint: string, options: ApiOptions) => {
    const BASE_URL = 'http://localhost:3001'; // Backend URL for local development
    const token = getAuthToken();
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api${endpoint}`, options);
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};


export async function editImage(base64ImageData: string, mimeType: string, prompt: string, model: string): Promise<{ newImageBase64: string | null; text: string | null }> {
  try {
    const response = await apiFetch('/gemini/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64ImageData, mimeType, prompt, model }),
    });
    return response;
  } catch (error) {
    console.error("Error calling backend for image editing:", error);
    throw error;
  }
}


export async function generateVideo(prompt: string, startImage: { base64: string; mimeType: string } | null): Promise<string | null> {
    try {
        const response = await apiFetch('/gemini/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, startImage }),
        });
        
        // The backend now handles polling and returns a direct, authenticated download link.
        // We fetch this URL to get the video blob.
        const videoResponse = await fetch(response.videoUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video from signed URL: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error calling backend for video generation:", error);
        throw error;
    }
}