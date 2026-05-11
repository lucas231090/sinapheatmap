import { useTheme } from "@/hooks/useTheme";

/**
 * Hook para gerenciar a lógica do LoggedInHeader
 * Agora usa o hook useTheme otimizado ao invés de duplicar lógica
 */
const useLoggedInHeader = () => {
    // Usar o hook de tema otimizado ao invés de duplicar a lógica
    const { logoSrc } = useTheme();

    return {
        logoSrc,
    };
};

export default useLoggedInHeader;
