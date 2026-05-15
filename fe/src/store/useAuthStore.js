import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  getAuthErrorMessage,
  meRequest,
  signInRequest,
  signUpRequest,
} from "@/services/nAuthService";
import { getTokenExpirationDate, isTokenExpired } from "@/utils/jwt";

const initialState = {
  user: null,
  accessToken: null,
  tokenExpiresAt: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  hasInitialized: false,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      setHydrated: (value) => {
        set({ hasHydrated: value });
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          hasInitialized: true,
        });
      },
      initializeSession: async () => {
        if (get().hasInitialized || get().isLoading) {
          return;
        }

        const { accessToken } = get();

        if (!accessToken || isTokenExpired(accessToken)) {
          get().logout();
          return;
        }

        set({ isLoading: true });

        try {
          const response = await meRequest(accessToken);

          set({
            user: response.user,
            isAuthenticated: true,
            tokenExpiresAt:
              getTokenExpirationDate(accessToken)?.toISOString() || null,
            hasInitialized: true,
            isLoading: false,
          });
        } catch {
          get().logout();
        }
      },
      signIn: async ({ email, password }) => {
        set({ isLoading: true });

        try {
          const response = await signInRequest({ email, password });
          const expiresAt =
            getTokenExpirationDate(response.accessToken)?.toISOString() || null;

          set({
            user: response.user,
            accessToken: response.accessToken,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            hasInitialized: true,
            isLoading: false,
          });

          return response;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(getAuthErrorMessage(error, "Falha ao entrar."));
        }
      },
      signUp: async ({ name, email, password }) => {
        set({ isLoading: true });

        try {
          const response = await signUpRequest({ name, email, password });
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw new Error(getAuthErrorMessage(error, "Falha ao criar conta."));
        }
      },
    }),
    {
      name: "n-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
