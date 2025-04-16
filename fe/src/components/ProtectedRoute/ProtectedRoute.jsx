import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ children, requiresAuth = true }) => {
  const { isLoggedIn } = useContext(AuthContext);

  // Se a rota requer autenticação e o usuário não está logado, redireciona para login
  if (requiresAuth && !isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
