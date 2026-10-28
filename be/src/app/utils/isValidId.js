function isValidId(string) {
  const regex = /^[0-9a-fA-F]{24}$/;

  return regex.test(string);
}

module.exports = isValidId;
