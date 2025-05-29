import React from "react";
import { Link } from "react-router-dom";
import useLoggedInHeader from "@/hooks/useLoggedInHeader";

/**
 * Componente LoggedInHeader otimizado
 * Responsável apenas pela apresentação do cabeçalho quando o usuário está logado
 */
const LoggedInHeader = React.memo(({ body }) => {
  // Hook centralizado para lógica do header
  const { logoSrc } = useLoggedInHeader();

  return (
    <header className="bg-bg dark:bg-darkbg text-title dark:text-darktitle flex flex-row justify-start p-4 pb-0 items-center transition-colors duration-300">
      <nav className="flex flex-row items-center justify-between w-full px-7">
        <Link to="/">
          <img
            src={logoSrc}
            alt="Sinapsense Logo"
            className="h-25 w-auto mr-4"
            loading="lazy"
          />
        </Link>
        {body}
      </nav>
    </header>
  );
});

LoggedInHeader.displayName = "LoggedInHeader";

export default LoggedInHeader;
