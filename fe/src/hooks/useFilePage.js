/**
 * Hook para gerenciar lógica de negócio da página de arquivos
 * Contém toda a lógica de estado e operações com arquivos
 */
import { useState } from 'react';
import { deactivateFile } from '@/services/fileService';
import { useFileContext } from '@/context/FileContext';

export const useFilePage = () => {
    const [modalIsOpen, setIsOpen] = useState({ open: false, id: "" });
    const {
        files: getFiles,
        fetchData,
        showNotification,
        notification,
    } = useFileContext();

    const abrirModal = (id) => {
        setIsOpen({ open: true, id });
    };

    const fecharModal = async (confirm) => {
        if (confirm) {
            try {
                await deactivateFile(modalIsOpen.id);

                console.log("Arquivo atualizado com sucesso");
                fetchData(); // Atualiza a lista após a exclusão
                showNotification("Arquivo atualizado com sucesso!", "success");
            } catch (err) {
                console.error("Erro ao excluir arquivo:", err.message);
                showNotification(
                    err.message || "Erro ao atualizar visibilidade do arquivo",
                    "error"
                );
            }
        }
        setIsOpen({ open: false, id: "" });
    };

    return {
        modalIsOpen,
        getFiles,
        notification,
        abrirModal,
        fecharModal,
        showNotification
    };
};
