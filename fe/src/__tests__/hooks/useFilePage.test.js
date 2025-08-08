/**
 * Testes para useFilePage hook
 */
import { renderHook, act } from '@testing-library/react';
import { useFilePage } from '@/hooks/useFilePage';
import { deactivateFile } from '@/services/fileService';
import { useFileContext } from '@/context/FileContext';

// Mocks
jest.mock('@/services/fileService');
jest.mock('@/context/FileContext');

// Mock do módulo de configuração para evitar problemas com import.meta.env
jest.mock('@/../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'
    }
}));

const mockDeactivateFile = jest.mocked(deactivateFile);
const mockUseFileContext = jest.mocked(useFileContext);

describe('useFilePage', () => {
    const mockShowNotification = jest.fn();
    const mockFetchData = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseFileContext.mockReturnValue({
            files: [],
            fetchData: mockFetchData,
            showNotification: mockShowNotification,
            notification: { message: '', type: '' }
        });
    });

    test('deve inicializar com modal fechado', () => {
        const { result } = renderHook(() => useFilePage());

        expect(result.current.modalIsOpen).toEqual({ open: false, id: "" });
    });

    test('deve abrir modal com ID correto', () => {
        const { result } = renderHook(() => useFilePage());

        act(() => {
            result.current.abrirModal('test-id');
        });

        expect(result.current.modalIsOpen).toEqual({ open: true, id: "test-id" });
    });

    test('deve fechar modal sem confirmar', async () => {
        const { result } = renderHook(() => useFilePage());

        // Abre modal primeiro
        act(() => {
            result.current.abrirModal('test-id');
        });

        // Fecha sem confirmar
        await act(async () => {
            await result.current.fecharModal(false);
        });

        expect(result.current.modalIsOpen).toEqual({ open: false, id: "" });
        expect(mockDeactivateFile).not.toHaveBeenCalled();
    });

    test('deve confirmar e desativar arquivo com sucesso', async () => {
        mockDeactivateFile.mockResolvedValueOnce();

        const { result } = renderHook(() => useFilePage());

        // Abre modal
        act(() => {
            result.current.abrirModal('test-id');
        });

        // Confirma ação
        await act(async () => {
            await result.current.fecharModal(true);
        });

        expect(mockDeactivateFile).toHaveBeenCalledWith('test-id');
        expect(mockFetchData).toHaveBeenCalled();
        expect(mockShowNotification).toHaveBeenCalledWith('Arquivo atualizado com sucesso!', 'success');
        expect(result.current.modalIsOpen).toEqual({ open: false, id: "" });
    });

    test('deve lidar com erro na desativação', async () => {
        const errorMessage = 'Erro ao desativar';
        mockDeactivateFile.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useFilePage());

        // Abre modal
        act(() => {
            result.current.abrirModal('test-id');
        });

        // Confirma ação que falha
        await act(async () => {
            await result.current.fecharModal(true);
        });

        expect(mockDeactivateFile).toHaveBeenCalledWith('test-id');
        expect(mockShowNotification).toHaveBeenCalledWith(errorMessage, 'error');
        expect(result.current.modalIsOpen).toEqual({ open: false, id: "" });
    });
});
