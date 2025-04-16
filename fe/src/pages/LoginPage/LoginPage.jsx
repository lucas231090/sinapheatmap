import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [logoSrc, setLogoSrc] = useState("");

  // Função para atualizar o logo com base no tema atual
  const updateLogo = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setLogoSrc(isDark ? "/SinapsenseLogoDarkMode.png" : "/SinapsenseLogo.png");
  };

  // Executar updateLogo na montagem inicial e quando houver mudanças
  useEffect(() => {
    // Atualizar logo imediatamente na montagem
    updateLogo();

    // Configurar um observer para detectar mudanças nas classes do documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateLogo();
        }
      });
    });

    // Iniciar observação
    observer.observe(document.documentElement, { attributes: true });

    // Limpar o observer quando o componente for desmontado
    return () => observer.disconnect();
  }, []);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Falha no login. Verifique seu email e senha.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] ">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-lg md:max-w-2xl p-6 bg-card dark:bg-darkcard shadow-md rounded-lg">
        {/* Logo Section */}
        <div className="md:w-1/2 flex justify-center items-center pb-6 md:pr-6 md:pb-0 border-b border-gray-300 dark:border-gray-500 md:border-b-0 md:border-r md:dark:border-gray-500">
          <img
            src={logoSrc || "/SinapsenseLogo.png"}
            alt="Sinapsense Logo"
            className="h-30 w-auto"
          />
        </div>
        {/* Login Form Section */}
        <div className="md:w-1/2 md:pl-6 mt-6 md:mt-0">
          <h2 className="text-2xl font-bold mb-4 text-tittle dark:text-darktitle">
            Login
          </h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="w-full">
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
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2  rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
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
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2  rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-sinapgreen-500 text-white py-2 px-4 rounded-md hover:bg-sinapgreen-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Entrar
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
      </div>
    </div>
  );
};

export default LoginPage;
