import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { validateSignUpForm } from "@/utils/authValidation";
import Card from "@/components/general/Card";
import Input from "@/components/general/Input";
import Button from "@/components/general/Button";

function NSignUpPage() {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const { notifyError, notifySuccess } = useNotifications();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateSignUpForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      notifyError("Confira os campos do cadastro antes de continuar.");
      return;
    }

    try {
      await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      notifySuccess("Conta criada com sucesso. Faça login para continuar.");
      navigate("/", { replace: true });
    } catch (error) {
      notifyError(error.message);
    }
  };

  return (
    <section className="flex w-full items-center justify-center p-6 text-black dark:text-white">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight">Cadastro</h1>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="name">Nome</label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              error={errors.email}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password">Senha</label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              error={errors.password}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </Card>
    </section>
  );
}

export default NSignUpPage;

