function isBlank(value) {
  return !String(value || "").trim();
}

export function validateSignInForm({ email, password }) {
  const errors = {};

  if (isBlank(email)) {
    errors.email = "Informe o email.";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Informe um email valido.";
  }

  if (isBlank(password)) {
    errors.password = "Informe a senha.";
  }

  return errors;
}
