/**
 * Índice centralizado dos serviços
 * Services devem conter APENAS comunicação com backend
 */

// Serviços principais - comunicação com backend
export { default as api } from './api';
export * as authService from './authService';
export * as fileService from './fileService';