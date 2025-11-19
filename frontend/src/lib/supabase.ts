import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Decode JWT token to check expiration
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    if (!exp) return true;

    // Check if token expires in less than 60 seconds (buffer time)
    const now = Math.floor(Date.now() / 1000);
    return exp < now + 60;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If we can't decode, assume expired
  }
}

/**
 * Get an authenticated Supabase client instance
 * Creates a new client with the access token from localStorage
 * Automatically refreshes the token if it's expired
 */
export async function getAuthenticatedSupabase() {
  let accessToken = localStorage.getItem("access_token");
  let refreshToken = localStorage.getItem("refresh_token");

  if (!accessToken) {
    throw new Error("No access token found. Please log in.");
  }

  // Check if token is expired
  if (isTokenExpired(accessToken)) {
    console.log("[Supabase] Access token expired, refreshing...");

    if (!refreshToken) {
      throw new Error(
        "Access token expired and no refresh token available. Please log in again."
      );
    }

    // Create a temporary client to refresh the token
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    try {
      // Use refresh token to get new access token
      const { data, error } = await tempClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        console.error("[Supabase] Token refresh failed:", error);
        // Clear invalid tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isAuthenticated");
        throw new Error("Failed to refresh token. Please log in again.");
      }

      // Update tokens in localStorage
      accessToken = data.session.access_token;
      refreshToken = data.session.refresh_token;

      localStorage.setItem("access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }

      console.log("[Supabase] Token refreshed successfully");
    } catch (error) {
      console.error("[Supabase] Error refreshing token:", error);
      // Clear invalid tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("isAuthenticated");
      throw new Error("Failed to refresh token. Please log in again.");
    }
  }

  // Create a new client instance with the (possibly refreshed) token
  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Set the session
  if (refreshToken) {
    await authenticatedClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return authenticatedClient;
}
