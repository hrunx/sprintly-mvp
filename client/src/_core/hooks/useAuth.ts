import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Demo mode: no authentication required
  const demoUser = useMemo(() => {
    return { id: 0, name: "Demo User", email: "demo@example.com", role: "user" } as any;
  }, []);

  const logout = useCallback(async () => {
    // no-op
  }, []);

  const state = useMemo(() => {
    return {
      user: demoUser,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, [demoUser]);

  return {
    ...state,
    refresh: async () => {},
    logout,
  };
}
