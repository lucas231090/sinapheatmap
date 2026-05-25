import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { validateSignInForm } from "@/utils/authValidation";
import Card from "@/components/general/Card";
import Input from "@/components/general/Input";
import Button from "@/components/general/Button";

function NSignInPage() {
  const navigate = useNavigate();
  const { signIn, isLoading, isAuthenticated, hasHydrated } = useAuth();
  const { notifyError, notifySuccess } = useNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateSignInForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      notifyError("Preencha os campos obrigatorios para continuar.");
      return;
    }

    try {
      await signIn(formData);
      notifySuccess("Login realizado com sucesso.");
      navigate("/home", { replace: true });
    } catch (error) {
      notifyError(error.message);
    }
  };

  return (
    <section className="flex w-full items-center justify-center p-6 text-black dark:text-white">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight">Login</h1>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
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
              onChange={handleChange}
              autoComplete="current-password"
              error={errors.password}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </section>
  );
}

export default NSignInPage;

