import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAdmin } from "./AdminContext";

interface AccessControlContextType {
  adminRole: string | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isAdmin: boolean;
  hasFullAccess: boolean;
  isLoading: boolean;
}

const AccessControlContext = createContext<
  AccessControlContextType | undefined
>(undefined);

/**
 * Hook to access access control functions and role information
 * @returns AccessControlContextType with role checking functions
 *
 * @example
 * ```tsx
 * const { hasRole, hasAnyRole, isAdmin } = useAccessControl();
 *
 * if (hasRole("admin")) {
 *   // Show admin-only features
 * }
 *
 * if (hasAnyRole(["admin", "manager"])) {
 *   // Show features for admin or manager
 * }
 * ```
 */
export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error(
      "useAccessControl must be used within an AccessControlProvider"
    );
  }
  return context;
}

interface AccessControlProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and provides access control functionality
 * Must be used within AdminProvider
 */
export function AccessControlProvider({
  children,
}: AccessControlProviderProps) {
  const { admin, isLoading } = useAdmin();

  // Get admin role
  const adminRole = admin?.role || null;

  /**
   * Check if user is an admin (convenience method)
   * Checks for common admin role names: "admin", "administrator", "superadmin", "super-admin"
   */
  const isAdmin = useMemo(() => {
    if (!adminRole) return false;
    const roleLower = adminRole.toLowerCase().trim();
    return (
      roleLower === "admin" ||
      roleLower === "administrator" ||
      roleLower === "superadmin" ||
      roleLower === "super admin" ||
      roleLower === "super-admin"
    );
  }, [adminRole]);

  /**
   * Check if user has a specific role (case-insensitive)
   * Admins and super-admins have full access and will always return true
   * @param role - The role to check (e.g., "admin", "manager", "editor")
   * @returns true if user has the specified role or is an admin/super-admin
   */
  const hasRole = (role: string): boolean => {
    if (!adminRole) return false;
    // Admins and super-admins have full access
    if (isAdmin) return true;
    return adminRole.toLowerCase() === role.toLowerCase();
  };

  /**
   * Check if user has any of the specified roles (case-insensitive)
   * Admins and super-admins have full access and will always return true
   * @param roles - Array of roles to check
   * @returns true if user has any of the specified roles or is an admin/super-admin
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!adminRole) return false;
    // Admins and super-admins have full access
    if (isAdmin) return true;
    return roles.some((role) => adminRole.toLowerCase() === role.toLowerCase());
  };

  /**
   * Check if user has all of the specified roles (case-insensitive)
   * Admins and super-admins have full access and will always return true
   * Note: In a single-role system, this returns true only if the user's role
   * is present in the array and all roles in the array match the user's role.
   * @param roles - Array of roles to check
   * @returns true if user has all of the specified roles or is an admin/super-admin
   */
  const hasAllRoles = (roles: string[]): boolean => {
    if (!adminRole || roles.length === 0) return false;
    // Admins and super-admins have full access
    if (isAdmin) return true;
    const roleLower = adminRole.toLowerCase();
    // Check if user's role is in the array and all roles match
    return (
      roles.some((role) => role.toLowerCase() === roleLower) &&
      roles.every((role) => role.toLowerCase() === roleLower)
    );
  };

  /**
   * Check if user has full access (admin or super-admin)
   * Users with full access bypass all role checks
   */
  const hasFullAccess = useMemo(() => {
    return isAdmin;
  }, [isAdmin]);

  const value = useMemo(
    () => ({
      adminRole,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      isAdmin,
      hasFullAccess,
      isLoading,
    }),
    [adminRole, isAdmin, hasFullAccess, isLoading]
  );

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}
