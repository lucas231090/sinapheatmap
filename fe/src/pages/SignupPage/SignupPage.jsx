import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
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

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      await registerUser(name, email, password);
      navigate("/login", {
        state: { message: "Cadastro realizado com sucesso! Faça o login." },
      });
    } catch (err) {
      setError("Erro ao registrar. Verifique seus dados e tente novamente.");
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] ">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-lg md:max-w-2xl p-6 bg-card dark:bg-darkcard shadow-md rounded-md">
        {/* Logo Section */}
        <div className="md:w-1/2 flex justify-center items-center pb-6 md:pr-6 md:pb-0 border-b border-gray-300 dark:border-gray-500 md:border-b-0 md:border-r md:dark:border-gray-500">
          <img
            src={logoSrc || "/SinapsenseLogo.png"}
            alt="Sinapsense Logo"
            className="h-30 w-auto"
          />
        </div>

        {/* Signup Form Section */}
        <div className="md:w-1/2 md:pl-6 mt-6 md:mt-0">
          <h2 className="text-2xl font-bold mb-4 text-tittle dark:text-darktitle">
            Criar Conta
          </h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
              >
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2  rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
              />
            </div>
            <div>
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
            <div>
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
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
              >
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2  rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sinapgreen-500 text-white py-2 px-4 rounded-md hover:bg-sinapgreen-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Registrar
            </button>
          </form>
          <p className="mt-4 text-sm text-smalltext dark:text-darksmalltext">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
