import React from "react";
import { Link } from "react-router-dom";

/**
 * Componente do formulário de login
 * Recebe as props necessárias para gerenciar o estado e as ações
 */
const LoginForm = ({
  email,
  password,
  error,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onErrorClear,
}) => {
  return (
    <div className="md:w-1/2 md:pl-6 mt-6 md:mt-0">
      <h2 className="text-2xl font-bold mb-4 text-tittle dark:text-darktitle">
        Login
      </h2>

      {error && (
        <div className="text-red-500 mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={onErrorClear}
            className="ml-2 text-red-400 hover:text-red-600 text-sm"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="w-full">
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Senha
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sinapgreen-500 text-white py-2 px-4 rounded-md hover:bg-sinapgreen-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-smalltext dark:text-darksmalltext">
        Não tem uma conta?{" "}
        <Link
          to="/signup"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Registre-se
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
