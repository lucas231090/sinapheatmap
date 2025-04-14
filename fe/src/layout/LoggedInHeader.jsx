import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function LoggedInHeader({ body }) {
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

  return (
    <header className="bg-white dark:bg-gray-800 text-black dark:text-white flex flex-row justify-start p-4 items-center transition-colors duration-300">
      <nav className="flex flex-row items-center justify-between w-full px-7">
        <Link to="/">
          <img
            src={logoSrc || "/SinapsenseLogo.png"} // Fallback para evitar erro de imagem
            alt="Sinapsense Logo"
            className="h-25 w-auto mr-4"
          />
        </Link>
        {body}
      </nav>
    </header>
  );
}

export default LoggedInHeader;
