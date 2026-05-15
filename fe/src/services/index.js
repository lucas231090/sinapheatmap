/**
 * Índice centralizado dos serviços
 * Services devem conter APENAS comunicação com backend
 */

// Serviços principais - comunicação com backend
export { default as api } from "@/services/api";
export * as fileService from "@/services/fileService";
export * as eyetrackingService from "@/services/eyetrackingService";
