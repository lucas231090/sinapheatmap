import React from "react";

/**
 * Componente otimizado para exibir o logo da Sinapsense
 * Usa React.memo para evitar re-renderizações desnecessárias
 * Recebe a fonte do logo como prop
 */
const Logo = React.memo(({ logoSrc }) => {
  return (
    <div className="md:w-1/2 flex justify-center items-center pb-6 md:pr-6 md:pb-0 border-b border-gray-300 dark:border-gray-500 md:border-b-0 md:border-r md:dark:border-gray-500">
      <img
        src={logoSrc || "/SinapsenseLogo.png"}
        alt="Sinapsense Logo"
        className="h-24 sm:h-28 w-auto max-w-full object-contain"
        loading="lazy"
      />
    </div>
  );
});

Logo.displayName = "Logo";

export default Logo;
