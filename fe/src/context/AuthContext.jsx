import React, { createContext, useState, useEffect } from "react";
import { loginUser, logout, isAuthenticated } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário já está autenticado (possui token)
    const checkLoggedIn = async () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        // Caso no futuro queira buscar informações do usuário, coloque aqui
        setUser({ isLoggedIn: true });
      } else {
        setUser({ isLoggedIn: false });
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser({ isLoggedIn: true });
    return data;
  };

  const handleLogout = () => {
    logout();
    setUser({ isLoggedIn: false });
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout: handleLogout,
        isLoggedIn: user?.isLoggedIn || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
