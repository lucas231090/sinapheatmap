function isValidid(string) {
  const regex = /^[0-9a-fA-F]{24}$/;

  return regex.test(string);
}

module.exports = isValidid;
