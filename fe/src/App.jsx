import React from "react";
import { Route, Routes, Navigate, RouterProvider } from "react-router-dom";
import "@/App.css";
import FilePage from "@/pages/FilePage/FilePage";
import Layout from "@/layout/Layout";
import HeatmapStatic from "@/pages/HeatmapStatic/HeatmapStatic";
import HeatmapVideo from "@/pages/HeatmapVideo/HeatmapVideo";
import LoginPage from "@/pages/LoginPage/LoginPage";
import SignupPage from "@/pages/SignupPage/SignupPage";
import { FileProvider } from "@/context/FileContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import { NotificationProvider } from "@/context/NotificationContext";
import { appRoutes } from "@/routes/index";

function App() {
  return (
    // <NotificationProvider>
    //   <AuthProvider>
    //     <FileProvider>
    //       <Layout>
    //         <Routes>
    //           {/* Rotas públicas */}
    //           <Route path="/login" element={<LoginPage />} />
    //           <Route path="/signup" element={<SignupPage />} />

    //           {/* Rotas de visualização: públicas para permitir compartilhamento por link sem login */}
    //           <Route path="/eyeheatmap/:id" element={<HeatmapStatic />} />
    //           <Route path="/heatmap-video/:id" element={<HeatmapVideo />} />

    //           {/* Rotas protegidas (requerem autenticação) */}
    //           <Route
    //             path="/"
    //             element={
    //               <ProtectedRoute>
    //                 <FilePage />
    //               </ProtectedRoute>
    //             }
    //           />

    //           {/* Rota de fallback */}
    //           <Route path="*" element={<Navigate to="/" replace />} />
    //         </Routes>
    //       </Layout>
    //     </FileProvider>
    //   </AuthProvider>
    // </NotificationProvider>
    <RouterProvider router={appRoutes} />
  );
}

export default App;
