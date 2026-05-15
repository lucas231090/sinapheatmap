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

export function validateSignUpForm({ name, email, password, confirmPassword }) {
  const errors = {};

  if (isBlank(name)) {
    errors.name = "Informe o nome.";
  }

  if (isBlank(email)) {
    errors.email = "Informe o email.";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Informe um email valido.";
  }

  if (isBlank(password)) {
    errors.password = "Informe a senha.";
  } else if (password.length < 8) {
    errors.password = "A senha deve ter no minimo 8 caracteres.";
  }

  if (isBlank(confirmPassword)) {
    errors.confirmPassword = "Confirme a senha.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas precisam ser iguais.";
  }

  return errors;
}
