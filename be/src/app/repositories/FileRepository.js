const File = require("../models/File");

class FileRepository {
  async findByFilename(filename) {
    return await File.findOne({ filename });
  }

  async create(fileData) {
    const file = new File(fileData);
    return await file.save();
  }

  async getAllFiles() {
    return await File.find();
  }

  async getAllActiveFiles() {
    return await File.find({ active: true });
  }

  async getFileById(id) {
    return await File.findById(id);
  }

  async updateFile(id, updateData) {
    return await File.findByIdAndUpdate(id, updateData, { new: true });
  }

  async updateFileStatus(id, active) {
    return await File.findByIdAndUpdate(id, { active }, { new: true });
  }
}

module.exports = new FileRepository();
