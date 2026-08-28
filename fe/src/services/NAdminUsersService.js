import api from "./api";

/**
 * Service responsível por chamadas de API do Admin para gerenciar usuários.
 */
export const NAdminUsersService = {
  /**
   * Lista todos os usuários.
   * @returns {Promise<Array>} Lista de usuários
   */
  async getAllUsers() {
    const response = await api.get("/admin/users");
    return response.data;
  },

  /**
   * Cria um novo usuário.
   * @param {Object} userData - Dados do usuário (name, email, password, role)
   * @returns {Promise<Object>} Dados do usuário criado
   */
  async createUser(userData) {
    const response = await api.post("/admin/users", userData);
    return response.data;
  },

  /**
   * Atualiza um usuário existente.
   * @param {string} id - ID do usuário
   * @param {Object} userData - Dados a atualizar
   * @returns {Promise<Object>} Dados do usuário atualizado
   */
  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  /**
   * Deleta um usuário.
   * @param {string} id - ID do usuário
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
};

export default NAdminUsersService;
