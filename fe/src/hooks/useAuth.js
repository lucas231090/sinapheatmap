import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasHydrated,
    initializeSession,
    signIn,
    signUp,
    logout,
  };
}
