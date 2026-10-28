const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./app/models/User");

async function seedAdmin() {
  try {
    
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@admin.com";
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Usuário admin já existe.");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log(`Email: ${adminEmail}`);
    console.log("Senha configurada.");
  } catch (error) {
    console.error("Erro ao criar admin:", error);
  }
}

module.exports = seedAdmin;
