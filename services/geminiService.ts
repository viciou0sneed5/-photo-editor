
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

export async function generateVideo(prompt: string): Promise<string> {
    const BASE_URL = 'http://localhost:3001';
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/gemini/generate-video`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error.' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const videoBlob = await response.blob();
        if (videoBlob.size === 0) {
            console.warn('Received an empty blob for the video.');
            throw new Error("The AI service returned an empty video file.");
        }
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error calling backend for video generation:", error);
        throw error;
    }
}