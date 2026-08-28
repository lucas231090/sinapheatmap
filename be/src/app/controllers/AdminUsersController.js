const { z } = require("zod");
const { hash } = require("bcryptjs");
const UserRepository = require("../repositories/UserRepository");
const isValidId = require("../utils/isValidId");

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().min(1),
  password: z.string().min(8),
  role: z.enum(["researcher", "admin"]).default("researcher"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().min(1).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["researcher", "admin"]).optional(),
});

class AdminUsersController {
  async index(request, response) {
    try {
      const users = await UserRepository.findAll();
      return response.status(200).json(users);
    } catch (error) {
      return response.status(500).json({ error: "Erro ao buscar usuários" });
    }
  }

  async store(request, response) {
    try {
      const { email, name, password, role } = userSchema.parse(request.body);

      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        return response.status(409).json({ error: "Este email já está em uso." });
      }

      const hashedPassword = await hash(password, 10);
      const newUser = await UserRepository.create({
        name,
        email,
        password: hashedPassword,
        role: role || "researcher",
      });

      return response.status(201).json({
        id: String(newUser._id),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return response.status(400).json({ error: "Dados inválidos", details: error.issues });
      }
      return response.status(500).json({ error: "Erro ao criar usuário" });
    }
  }

  async update(request, response) {
    const { id } = request.params;

    if (!isValidId(id)) {
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const validatedData = updateUserSchema.parse(request.body);

      if (validatedData.email) {
        const existingUser = await UserRepository.findByEmail(validatedData.email);
        if (existingUser && String(existingUser._id) !== id) {
          return response.status(409).json({ error: "Este email já está em uso por outro usuário." });
        }
      }

      if (validatedData.password) {
        validatedData.password = await hash(validatedData.password, 10);
      }

      const targetUser = await UserRepository.findById(id);
      if (!targetUser) {
        return response.status(404).json({ error: "Usuário não encontrado" });
      }

      if (validatedData.role && validatedData.role !== "admin" && targetUser.role === "admin") {
        const adminCount = await UserRepository.countAdmins();
        if (adminCount <= 1) {
          return response.status(403).json({ error: "Não é possível alterar o cargo do único administrador do sistema." });
        }
      }

      const updatedUser = await UserRepository.update(id, validatedData);
      if (!updatedUser) {
        return response.status(404).json({ error: "Usuário não encontrado" });
      }

      return response.status(200).json(updatedUser);
    } catch (error) {
      if (error.name === "ZodError") {
        return response.status(400).json({ error: "Dados inválidos", details: error.issues });
      }
      return response.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  }

  async delete(request, response) {
    const { id } = request.params;

    if (!isValidId(id)) {
      return response.status(400).json({ error: "ID inválido" });
    }

    try {
      const targetUser = await UserRepository.findById(id);
      if (!targetUser) {
        return response.status(404).json({ error: "Usuário não encontrado" });
      }

      if (targetUser.role === "admin") {
        const adminCount = await UserRepository.countAdmins();
        if (adminCount <= 1) {
          return response.status(403).json({ error: "Não é possível excluir o único administrador do sistema." });
        }
      }

      const deletedUser = await UserRepository.delete(id);
      if (!deletedUser) {
        return response.status(404).json({ error: "Usuário não encontrado" });
      }

      return response.status(200).json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      return response.status(500).json({ error: "Erro ao deletar usuário" });
    }
  }
}

module.exports = new AdminUsersController();
