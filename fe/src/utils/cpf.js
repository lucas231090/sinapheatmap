const CPF_DIGITS_REGEX = /\D/g;

export function normalizeCpf(value) {
  return String(value || "")
    .replace(CPF_DIGITS_REGEX, "")
    .slice(0, 11);
}

export function formatCpf(value) {
  const digits = normalizeCpf(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`;
}

export function isValidCpf(value) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);

  const calculateDigit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += digits[index] * (length + 1 - index);
    }

    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calculateDigit(9);
  const secondDigit = calculateDigit(10);

  return firstDigit === digits[9] && secondDigit === digits[10];
}

export function normalizeComparableText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function participantMatchesAccess(participant, identity, mode) {
  const requiredMode = String(mode || "nome");
  const participantName = normalizeComparableText(participant?.name);
  const participantCpf = normalizeCpf(participant?.cpf);
  const inputName = normalizeComparableText(identity?.nome);
  const inputCpf = normalizeCpf(identity?.cpf);

  if (requiredMode === "cpf") {
    return Boolean(inputCpf) && participantCpf === inputCpf;
  }

  if (requiredMode === "nome-cpf") {
    return (
      Boolean(inputName) &&
      Boolean(inputCpf) &&
      participantName === inputName &&
      participantCpf === inputCpf
    );
  }

  return Boolean(inputName) && participantName === inputName;
}
