import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import FilePage from "./pages/FilePage/FilePage";
import Layout from "./layout/Layout";
import HeatmapStatic from "./pages/HeatmapStatic/HeatmapStatic";
import { FileProvider } from "./context/FileContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Estado de login

  return (
    <>
      <FileProvider>
        <Layout isLoggedIn={isLoggedIn}>
          <Routes>
            <Route path="/" element={<FilePage />} />
            <Route path="/eyeheatmap/:id" element={<HeatmapStatic />} />
          </Routes>
        </Layout>
      </FileProvider>
    </>
  );
}

export default App;
