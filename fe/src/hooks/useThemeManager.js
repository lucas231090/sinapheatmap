import { useState, useEffect, useCallback } from "react";

/**
 * Hook principal para gerenciar todo o sistema de temas
 * Centraliza toda a lógica de alternância e persistência de tema
 * Deve ser usado apenas uma vez no componente raiz
 */
export const useThemeManager = () => {
  // Inicializar com o tema salvo no localStorage ou padrão
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        return saved === "dark";
      }
    } catch (_error) {
      // Fallback to system preference if localStorage fails
      console.warn("localStorage not available, using system preference");
    }
    // Usar preferência do sistema se não houver tema salvo ou localStorage falhar
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Aplicar tema ao DOM e salvar no localStorage
  const applyTheme = useCallback((dark) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch (_error) {
      console.warn("Could not save theme preference to localStorage");
    }
  }, []);

  // Toggle do tema
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      applyTheme(newValue);
      return newValue;
    });
  }, [applyTheme]);

  // Aplicar tema inicial
  useEffect(() => {
    applyTheme(isDark);
  }, []); // Executa apenas uma vez na montagem

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      // Só alterar se não houver preferência salva
      let hasStoredTheme = false;
      try {
        hasStoredTheme = !!localStorage.getItem("theme");
      } catch (_error) {
        // If localStorage fails, always respond to system changes
        hasStoredTheme = false;
      }

      if (!hasStoredTheme) {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [applyTheme]);

  return {
    isDark,
    toggleTheme,
    logoSrc: isDark ? "/SinapsenseLogoDarkMode.png" : "/SinapsenseLogo.png",
  };
};
