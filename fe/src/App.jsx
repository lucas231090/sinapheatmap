import React, { useState } from "react";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import FilePage from "./pages/FilePage/FilePage";
import Layout from "./layout/Layout";
import HeatmapStatic from "./pages/HeatmapStatic/HeatmapStatic";
import HeatmapVideo from "./pages/HeatmapVideo/HeatmapVideo";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignupPage from "./pages/SignupPage/SignupPage";
import { FileProvider } from "./context/FileContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Estado de login

  return (
    <AuthProvider>
      <FileProvider>
        <Layout isLoggedIn={isLoggedIn}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/eyeheatmap/:id" element={<HeatmapStatic />} />
            <Route path="/heatmap-video/:id" element={<HeatmapVideo />} />

            {/* Rotas protegidas (requerem autenticação) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FilePage />
                </ProtectedRoute>
              }
            />

            {/* Rota de fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </FileProvider>
    </AuthProvider>
  );
}

export default App;
