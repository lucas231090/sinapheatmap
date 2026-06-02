import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export function ProtectedRoute({ allowedRoles }) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!hasHydrated || isLoading) return <div>Carregando&hellip;</div>;

  // 1. Não está logado? Vai para o login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. Não tem a permissão necessária? Vai para o acesso negado
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Tudo certo? Renderiza as rotas filhas
  return <Outlet />;
}
