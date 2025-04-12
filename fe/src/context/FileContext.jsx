import React, { createContext, useState, useContext, useEffect } from "react";

// Create the context
const FileContext = createContext();

// Custom hook to use the context
export const useFileContext = () => useContext(FileContext);

// Provider component
export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });

    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eyetracking`);
      if (!res.ok) {
        throw new Error("Erro ao buscar os arquivos");
      }
      const data = await res.json();
      setFiles(data);
      return data;
    } catch (err) {
      console.log("Erro ao buscar arquivos:", err.message);
      showNotification(err.message, "error");
      return [];
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Values to share through context
  const contextValue = {
    files,
    setFiles,
    fetchData,
    showNotification,
    notification,
    setNotification,
    API_BASE_URL,
  };

  return (
    <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
  );
};
