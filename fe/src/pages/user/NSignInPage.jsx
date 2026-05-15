import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { validateSignInForm } from "@/utils/authValidation";

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
    <section className="p-4 text-black">
      <h1>Login</h1>

      <form
        className="mt-4 flex max-w-md flex-col gap-3"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="border-black border-2 rounded"
          />
          {errors.email ? <span>{errors.email}</span> : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="border-black border-2 rounded"
          />
          {errors.password ? <span>{errors.password}</span> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="border-black border-2 rounded"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}

export default NSignInPage;
