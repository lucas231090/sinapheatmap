import { useState, useEffect } from "react";
import NAdminUsersService from "@/services/NAdminUsersService";
import Card from "@/components/general/Card";
import Button from "@/components/general/Button";
import Input from "@/components/general/Input";
import { useNotifications } from "@/hooks/useNotifications";

function NDashboardPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { notifySuccess, notifyError } = useNotifications();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "researcher"
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await NAdminUsersService.getAllUsers();
      setUsers(data);
    } catch (error) {
      notifyError("Erro ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // Não mostra a senha atual
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "researcher" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await NAdminUsersService.updateUser(editingUser._id, updateData);
        notifySuccess("Usuário atualizado com sucesso.");
      } else {
        await NAdminUsersService.createUser(formData);
        notifySuccess("Usuário criado com sucesso.");
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.error || "Erro ao salvar usuário.";
      notifyError(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
      try {
        await NAdminUsersService.deleteUser(id);
        notifySuccess("Usuário deletado.");
        fetchUsers();
      } catch (error) {
        notifyError("Erro ao deletar usuário.");
      }
    }
  };

  return (
    <section className="flex flex-col gap-10 text-black dark:text-white">
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-sinapgreen-900 dark:text-sinapgreen-500">
              Painel do Administrador
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Gerenciar Usuários
            </h1>
          </div>
          <Button onClick={() => openModal()} className="px-6 py-2">
            Nova Conta
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <p>Carregando usuários...</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Papel</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 font-medium">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end gap-2">
                    <Button onClick={() => openModal(user)} variant="secondary" size="sm">
                      Editar
                    </Button>
                    <Button onClick={() => handleDelete(user._id)} variant="danger" size="sm">
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal / Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-4">{editingUser ? "Editar Usuário" : "Nova Conta"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="name">Nome</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="password">
                  {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={8}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="role">Papel do Usuário</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-3 text-sm transition-colors focus:border-sinapgreen-400 focus:outline-none focus:ring-1 focus:ring-sinapgreen-400 dark:border-slate-700"
                >
                  <option value="researcher" className="text-black">Pesquisador</option>
                  <option value="admin" className="text-black">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? "Salvar" : "Criar Conta"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </section>
  );
}

export default NDashboardPage;
