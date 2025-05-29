import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { useLogin } from "@/hooks/useLogin";
import Logo from "@/components/General/Logo";
import LoginForm from "@/components/General/LoginForm";

/**
 * Página de Login
 * Componente responsável apenas pela apresentação da tela de login
 * A lógica está separada nos hooks useTheme e useLogin
 */
const LoginPage = () => {
  // Hook para gerenciar o tema e logo
  const { logoSrc } = useTheme();

  // Hook para gerenciar a lógica de login
  const {
    email,
    password,
    error,
    isLoading,
    setEmail,
    setPassword,
    handleSubmit,
    clearError,
  } = useLogin();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-lg md:max-w-2xl p-6 bg-card dark:bg-darkcard shadow-md rounded-lg">
        <Logo logoSrc={logoSrc} />

        <LoginForm
          email={email}
          password={password}
          error={error}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onErrorClear={clearError}
        />
      </div>
    </div>
  );
};

export default LoginPage;
