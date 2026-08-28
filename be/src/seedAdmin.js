const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./app/models/User");

async function seedAdmin() {
  try {
    
    const adminEmail = "admin@admin.com";
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Usuário admin já existe.");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      name: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("Email: admin@admin.com");
    console.log("Senha: admin123");
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  }
}

module.exports = seedAdmin;
