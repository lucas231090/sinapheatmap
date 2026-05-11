/**
 * Índice centralizado dos serviços
 * Services devem conter APENAS comunicação com backend
 */

// Serviços principais - comunicação com backend
export { default as api } from '@/services/api';
export * as authService from '@/services/authService';
export * as fileService from '@/services/fileService';