const Users = require("../models/User");

class UsersRepository {
  async findAll(sortOrder = 1) {
    const sortField = "createdAt";

    const sortOptions = { name: sortOrder };
    sortOptions[sortField] = sortOrder;

    const users = await Users.find().sort(sortOptions).select("-password");
    return users;
  }

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

  async update(id, data) {
    const updatedUser = await Users.findByIdAndUpdate(id, data, {
      new: true,
      useFindAndModify: false,
    });
    return updatedUser;
  }

  async deleteById(id) {
    const deletedUser = await Users.findByIdAndDelete(id);
    return deletedUser;
  }
}

module.exports = new UsersRepository();
