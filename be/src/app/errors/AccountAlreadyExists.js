class AccountAlreadyExists extends Error {
  constructor(message = "This email is already in use.") {
    super(message);
    this.name = "AccountAlreadyExists";
  }
}

module.exports = AccountAlreadyExists;
