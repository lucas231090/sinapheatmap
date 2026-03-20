import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/services/authService";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/services/api";

export const useSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(formData.name, formData.email, formData.password);
      notify({
        type: "success",
        message: "Cadastro realizado com sucesso! Faça o login.",
      });
      navigate("/login", {
        state: { message: "Cadastro realizado com sucesso! Faça o login." },
      });
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Erro ao registrar. Verifique seus dados e tente novamente.",
      );
      setError(message);
      notify({ type: "error", message });
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    error,
    isLoading,
    updateField,
    handleSubmit,
  };
};
