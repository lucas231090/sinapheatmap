/**
 * Testes unitários para o serviço de gerenciamento de arquivos (fileService)
 * Verifica todas as operações CRUD e manipulação de mídia
 */
import {
    getAllFiles,
    getFileById,
    uploadHeatmap,
    updateFile,
    deactivateFile,
    getFileMedia
} from '../fileService';
import api from '../api';

/**
 * Mock do módulo api
 * Substitui as funções de requisição HTTP por versões simuladas
 * para evitar chamadas reais à API durante os testes
 */
jest.mock('../api', () => ({
    get: jest.fn(),    // Mock para requisições GET
    post: jest.fn(),   // Mock para requisições POST
    put: jest.fn()     // Mock para requisições PUT
}));

/**
 * Mock para o módulo de configuração
 * Substitui import.meta.env que não é suportado no ambiente Jest
 * por uma implementação estática para testes
 */
jest.mock('../../../config', () => ({
    default: {
        API_BASE_URL: 'http://api.example.com'  // URL base para API em ambiente de teste
    }
}));

/**
 * Mock para a API URL.createObjectURL do navegador
 * Essa API converte blobs em URLs que podem ser usadas pelo navegador
 */
global.URL.createObjectURL = jest.fn();

describe('fileService', () => {
    /**
     * Antes de cada teste, limpa o histórico de chamadas dos mocks
     * para garantir que cada teste seja isolado
     */
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Testes para a função getAllFiles
     * Verifica se a função busca corretamente a lista de arquivos
     */
    describe('getAllFiles', () => {
        test('fetches all files from the API', async () => {
            // Mock de dados que a API retornaria
            const mockData = [
                { _id: '1', filename: 'test1.csv' },
                { _id: '2', filename: 'test2.csv' }
            ];
            // Configura o mock para retornar os dados de teste
            api.get.mockResolvedValueOnce({ data: mockData });

            // Executa a função que está sendo testada
            const result = await getAllFiles();

            // Verifica se a API foi chamada com o endpoint correto
            expect(api.get).toHaveBeenCalledWith('/eyetracking');
            // Verifica se a função retorna os dados corretamente
            expect(result).toEqual(mockData);
        });

        test('handles error when fetching files fails', async () => {
            // Simula um erro na chamada à API
            const error = new Error('Network error');
            api.get.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(getAllFiles()).rejects.toThrow(error);
        });
    });

    /**
     * Testes para a função getFileById
     * Verifica se a função busca corretamente um arquivo pelo ID
     */
    describe('getFileById', () => {
        test('fetches a file by ID', async () => {
            // Mock de dados para um arquivo específico
            const mockData = { _id: '1', filename: 'test1.csv' };
            api.get.mockResolvedValueOnce({ data: mockData });

            // Executa a função com um ID específico
            const result = await getFileById('1');

            // Verifica se a API foi chamada com o endpoint e parâmetro corretos
            expect(api.get).toHaveBeenCalledWith('/eyetracking/1');
            // Verifica se os dados retornados estão corretos
            expect(result).toEqual(mockData);
        });

        test('handles error when fetching file fails', async () => {
            // Simula erro ao buscar arquivo inexistente
            const error = new Error('File not found');
            api.get.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(getFileById('invalid-id')).rejects.toThrow(error);
        });
    });

    /**
     * Testes para a função uploadHeatmap
     * Verifica se a função envia corretamente dados de heatmap para a API
     */
    describe('uploadHeatmap', () => {
        test('uploads heatmap data to the API', async () => {
            // Cria um FormData simulado para upload
            const mockFormData = new FormData();
            mockFormData.append('csvFile', new File(['test'], 'test.csv'));

            // Simula resposta de sucesso da API
            const mockResponse = { data: { _id: '1', filename: 'test1.csv' } };
            api.post.mockResolvedValueOnce(mockResponse);

            // Executa o upload
            const result = await uploadHeatmap(mockFormData);

            // Verifica se a requisição POST foi feita corretamente
            expect(api.post).toHaveBeenCalledWith('/heatmap', mockFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'  // Header correto para upload de arquivos
                }
            });
            // Verifica se retorna os dados da resposta
            expect(result).toEqual(mockResponse.data);
        });

        test('handles error when upload fails', async () => {
            // Simula falha no upload
            const error = new Error('Upload failed');
            api.post.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(uploadHeatmap(new FormData())).rejects.toThrow(error);
        });
    });

    /**
     * Testes para a função updateFile
     * Verifica se a função atualiza corretamente um arquivo existente
     */
    describe('updateFile', () => {
        test('updates a file with new data', async () => {
            // Dados para a atualização
            const fileId = '1';
            const fileData = { filename: 'updated.csv' };
            // Resposta simulada da API após atualização
            const mockResponse = { data: { _id: '1', filename: 'updated.csv' } };
            api.put.mockResolvedValueOnce(mockResponse);

            // Executa a atualização
            const result = await updateFile(fileId, fileData);

            // Verifica se a requisição PUT foi feita corretamente
            expect(api.put).toHaveBeenCalledWith(`/heatmap/${fileId}`, fileData);
            // Verifica se retorna os dados atualizados
            expect(result).toEqual(mockResponse.data);
        });

        test('handles error when update fails', async () => {
            // Simula falha na atualização
            const error = new Error('Update failed');
            api.put.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(updateFile('1', { filename: 'test' })).rejects.toThrow(error);
        });
    });

    /**
     * Testes para a função deactivateFile
     * Verifica se a função desativa corretamente um arquivo
     */
    describe('deactivateFile', () => {
        test('deactivates a file by setting active to false', async () => {
            const fileId = '1';
            // Resposta simulada da API após desativação
            const mockResponse = { data: { _id: '1', active: false } };
            api.put.mockResolvedValueOnce(mockResponse);

            // Executa a desativação
            const result = await deactivateFile(fileId);

            // Verifica se a requisição PUT foi feita corretamente
            // com o campo active definido como false
            expect(api.put).toHaveBeenCalledWith(`/eyetracking/${fileId}`, { active: false });
            // Verifica se retorna os dados atualizados
            expect(result).toEqual(mockResponse.data);
        });

        test('handles error when deactivation fails', async () => {
            // Simula falha na desativação
            const error = new Error('Deactivation failed');
            api.put.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(deactivateFile('1')).rejects.toThrow(error);
        });
    });

    /**
     * Testes para a função getFileMedia
     * Verifica se a função busca corretamente arquivos de mídia
     */
    describe('getFileMedia', () => {
        test('fetches media file and creates object URL', async () => {
            const mediaName = 'test.jpg';
            // Cria um blob simulado para representar um arquivo de mídia
            const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
            // URL simulada que seria criada pelo navegador
            const mockObjectUrl = 'blob:http://localhost/test';

            // Configura os mocks para simular o processo completo
            api.get.mockResolvedValueOnce({ data: mockBlob });
            URL.createObjectURL.mockReturnValueOnce(mockObjectUrl);

            // Executa a função para obter o arquivo de mídia
            const result = await getFileMedia(mediaName);

            // Verifica se a requisição GET foi feita com o caminho correto
            // e com o tipo de resposta blob
            expect(api.get).toHaveBeenCalledWith(`/uploads/media/${mediaName}`, {
                responseType: 'blob'
            });
            // Verifica se URL.createObjectURL foi chamado com o blob
            expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
            // Verifica se a função retorna a URL de objeto criada
            expect(result).toBe(mockObjectUrl);
        });

        test('handles error when fetching media fails', async () => {
            // Simula falha ao buscar mídia
            const error = new Error('Media not found');
            api.get.mockRejectedValueOnce(error);

            // Verifica se o erro é propagado corretamente
            await expect(getFileMedia('invalid.jpg')).rejects.toThrow(error);
        });
    });
});