import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import FilePage from "./pages/FilePage/FilePage";
import Layout from "./layout/Layout";
import HeatmapStatic from "./pages/HeatmapStatic/HeatmapStatic";
// import Notification from "./components/General/Notification";
import { FileProvider } from "./context/FileContext";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Estado de login
  // const [notification, setNotification] = useState({ message: "", type: "" });

  // const showNotification = (message, type = "info") => {
  //   setNotification({ message, type });

  //   // Remove a notificação automaticamente após 5 segundos
  //   setTimeout(() => {
  //     setNotification({ message: "", type: "" });
  //   }, 5000);
  // };

  return (
    <>
      {/* Notificação */}
      {/* <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      /> */}
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
