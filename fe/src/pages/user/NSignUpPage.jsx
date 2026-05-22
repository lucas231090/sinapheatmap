import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { validateSignUpForm } from "@/utils/authValidation";

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

  const handleChange = (event) => {
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
    <section className="flex w-full items-center justify-center p-6 text-black">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-8">
        <h1 className="text-3xl font-black tracking-tight">Cadastro</h1>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="border-black border-2 rounded"
            />
            {errors.name ? <span>{errors.name}</span> : null}
          </div>

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
              autoComplete="new-password"
              className="border-black border-2 rounded"
            />
            {errors.password ? <span>{errors.password}</span> : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              className="border-black border-2 rounded"
            />
            {errors.confirmPassword ? (
              <span>{errors.confirmPassword}</span>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-sinapgreen-500 px-4 py-3 font-bold text-black transition hover:bg-sinapgreen-400 disabled:opacity-50"
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default NSignUpPage;
