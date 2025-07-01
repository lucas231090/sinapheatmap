import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { getAllFiles } from "@/services/fileService";
import config from "@/../config";

const FileContext = createContext();

export const useFileContext = () => useContext(FileContext);

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false); // Adicionar estado de carregamento
  const notificationTimeoutRef = useRef(null); // Ref para armazenar o ID do setTimeout
  const API_BASE_URL = config.API_BASE_URL;

  const showNotification = (message, type = "info") => {
    // Cancelar qualquer timeout anterior
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ message, type });

    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ message: "", type: "" });
      notificationTimeoutRef.current = null; // Limpar a referência
    }, 5000);
  };

  const clearNotification = () => {
    // Cancelar o timeout ativo
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    // Limpar a notificação imediatamente
    setNotification({ message: "", type: "" });
  };

  const fetchData = async () => {
    try {
      setLoading(true); // Ativar estado de carregamento
      const data = await getAllFiles();
      setFiles(data); // Atualizar os arquivos no estado
      return data;
    } catch (err) {
      console.error("Erro ao buscar arquivos:", err.message);
      showNotification(err.message || "Erro ao buscar os arquivos", "error");
      return [];
    } finally {
      setLoading(false); // Desativar estado de carregamento
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const contextValue = {
    files,
    setFiles,
    fetchData,
    showNotification,
    clearNotification,
    notification,
    setNotification,
    loading,
    API_BASE_URL,
  };

  return (
    <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
  );
};
