import { useState, useEffect, useCallback } from "react";

// Singleton para o observer - evita múltiplos observers
let themeObserver = null;
let observerSubscribers = new Set();

/**
 * Hook otimizado para gerenciar o tema da aplicação
 * Usa singleton pattern para o MutationObserver evitando duplicação
 * Detecta mudanças no tema (dark/light) e retorna informações do tema
 */
export const useTheme = () => {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    // Memoizar o logo baseado no estado do tema
    const logoSrc = isDark ? "/SinapsenseLogoDarkMode.png" : "/SinapsenseLogo.png";

    // Função para atualizar o estado baseado no tema atual
    const updateTheme = useCallback(() => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, []);

    useEffect(() => {
        // Adicionar este hook aos subscribers
        observerSubscribers.add(updateTheme);

        // Criar observer apenas se não existir
        if (!themeObserver && observerSubscribers.size > 0) {
            themeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === "class") {
                        // Notificar todos os subscribers
                        observerSubscribers.forEach(callback => callback());
                    }
                });
            });
            themeObserver.observe(document.documentElement, { attributes: true });
        }

        // Cleanup quando o hook for desmontado
        return () => {
            observerSubscribers.delete(updateTheme);

            // Destruir observer se não há mais subscribers
            if (observerSubscribers.size === 0 && themeObserver) {
                themeObserver.disconnect();
                themeObserver = null;
            }
        };
    }, [updateTheme]);

    return {
        isDark,
        logoSrc,
        updateTheme
    };
};
