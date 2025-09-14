// --- REAL AUTHENTICATION SERVICE ---
// This file now makes API calls to a secure backend server.
// The backend is responsible for handling user data, passwords, and sessions.

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string; // JWT token from the backend
}

// A helper function for making API requests to our backend
const apiPost = async (endpoint: string, body: object) => {
    // In a real app, you would have the backend URL in an environment variable
    const BASE_URL = 'http://localhost:3001'; 
    
    const response = await fetch(`${BASE_URL}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};


/**
 * Makes a login request to the backend.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A Promise that resolves with the User object (including a JWT) from the backend.
 */
export const login = (email: string, password?: string): Promise<User> => {
  return apiPost('/login', { email, password });
};

/**
 * Makes a signup request to the backend. The backend will create the user and return a token.
 * @param name - The user's full name.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A Promise that resolves with the new User object (including a JWT).
 */
export const signup = (name: string, email: string, password?: string): Promise<User> => {
  // Our new backend creates the user and logs them in immediately, returning the user object with a token.
  return apiPost('/signup', { name, email, password });
};

/**
 * Sends the OTP to the backend for verification.
 * NOTE: This function is now DEPRECATED as our new backend handles signup directly.
 * It is kept here to prevent breaking the OtpPage component, but it should not be used.
 * The signup function should be used instead, which now returns a logged-in user.
 * @param email - The user's email.
 * @param otp - The one-time password entered by the user.
 * @returns A Promise that resolves with the new User object (including a JWT) from the backend.
 */
export const verifyOtp = (email: string, otp: string): Promise<User> => {
    // This is a mock implementation because the new backend does not have an OTP flow.
    console.warn("verifyOtp is deprecated. The backend now logs the user in upon signup.");
    return Promise.reject(new Error("OTP verification is not supported in this backend implementation."));
};

// The "Continue with Google" flow is now handled by redirecting to the backend.
// This client-side function is no longer needed.
