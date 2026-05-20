import { createBrowserRouter } from "react-router-dom";

import NLayout from "@/layout/NLayout";
import NSignUpPage from "@/pages/user/NSignUpPage";
import NSignInPage from "@/pages/user/NSignInPage";
import NNotFoundPage from "@/pages/user/NNotFoundPage";
import NTestPage from "@/pages/user/NTestPage";

import NHomePage from "@/pages/researcher/NHomePage";
import NHeatmapPage from "@/pages/researcher/NHeatmapPage";
import NCreatePage from "@/pages/researcher/NCreatePage";
import NEditPage from "@/pages/researcher/NEditPage";
import NImportPage from "@/pages/researcher/NImportPage";

import NDashboardPage from "@/pages/admin/NDashboardPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

export const appRoutes = createBrowserRouter([
  { path: "/", element: <NSignInPage /> },
  { path: "/login", element: <NSignInPage /> },
  { path: "/signup", element: <NSignUpPage /> },
  { path: "/unauthorized", element: <NNotFoundPage /> },
  { path: "/test/:id", element: <NTestPage /> },

  {
    element: <NLayout />,
    children: [
      // --- ROTAS EXCLUSIVAS: RESEARCHER + ADMIN ---
      {
        element: <ProtectedRoute allowedRoles={["researcher", "admin"]} />,
        children: [
          { path: "/home", element: <NHomePage /> },
          { path: "/heatmap/:id", element: <NHeatmapPage /> },
          { path: "/create", element: <NCreatePage /> },
          { path: "/edit/:id", element: <NEditPage /> },
          { path: "/import", element: <NImportPage /> },
        ],
      },

      // --- ROTAS EXCLUSIVAS: ADMIN ---
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [{ path: "/admin", element: <NDashboardPage /> }],
      },

      // --- FALLBACK (PÁGINA 404) ---
      { path: "*", element: <NNotFoundPage /> },
    ],
  },
]);
