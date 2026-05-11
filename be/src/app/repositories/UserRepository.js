const Users = require("../models/User");

class UsersRepository {
  async findById(id) {
    const user = await Users.findById(id).select("-password");
    return user;
  }

  async findByEmail(email) {
    return Users.findOne({ email });
  }

  async create(userData) {
    return Users.create(userData);
  }
}

module.exports = new UsersRepository();
