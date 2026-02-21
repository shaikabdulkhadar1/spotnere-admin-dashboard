import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow additional fields
}

interface AdminContextType {
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmin = useCallback(async () => {
    const accessToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    // Try to get admin ID from stored user or use email to fetch
    let adminId: string | null = null;
    let adminEmail: string | null = null;

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        adminId = user.id;
        adminEmail = user.email;
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to get admin by ID if available
      if (adminId) {
        const response = await fetch(`${API_URL}/api/admins/${adminId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdmin(data);
          localStorage.setItem("user", JSON.stringify(data));
          setIsLoading(false);
          return;
        }
      }

      // Fallback: Get admin by email
      if (adminEmail) {
        const encodedEmail = encodeURIComponent(adminEmail);
        const response = await fetch(
          `${API_URL}/api/admins/email/${encodedEmail}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAdmin(data);
          localStorage.setItem("user", JSON.stringify(data));
          setIsLoading(false);
          return;
        }
      }

      // If both fail, use stored user data
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAdmin(user);
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
    } catch (err) {
      console.error("Error fetching admin:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch admin data"
      );

      // Fallback to stored user data
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAdmin(user);
        } catch (e) {
          // Ignore parse errors
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    await fetchAdmin();
  }, [fetchAdmin]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (isAuthenticated) {
      fetchAdmin();
    } else {
      setAdmin(null);
      setIsLoading(false);
    }
  }, [fetchAdmin]);

  // Listen for storage changes to refetch when user logs in from another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated" && e.newValue === "true") {
        fetchAdmin();
      } else if (e.key === "isAuthenticated" && e.newValue === null) {
        setAdmin(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchAdmin]);

  // Listen for custom auth events to refetch in the same tab
  useEffect(() => {
    const handleAuthEvent = () => {
      const isAuthenticated =
        localStorage.getItem("isAuthenticated") === "true";
      if (isAuthenticated) {
        fetchAdmin();
      }
    };

    // Listen for custom event dispatched after login/signup
    window.addEventListener("auth-state-changed", handleAuthEvent);

    // Also listen for focus event to refetch when user returns to the tab
    window.addEventListener("focus", handleAuthEvent);

    return () => {
      window.removeEventListener("auth-state-changed", handleAuthEvent);
      window.removeEventListener("focus", handleAuthEvent);
    };
  }, [fetchAdmin]);

  return (
    <AdminContext.Provider value={{ admin, isLoading, error, refreshAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}
