class InvalidCredentials extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentials";
  }
}

module.exports = InvalidCredentials;
