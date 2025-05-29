import { Link } from "react-router-dom";

const SignupForm = ({
  formData,
  error,
  isLoading,
  onFieldChange,
  onSubmit,
}) => {
  return (
    <div className="md:w-1/2 md:pl-6 mt-6 md:mt-0">
      <h2 className="text-2xl font-bold mb-4 text-tittle dark:text-darktitle">
        Criar Conta
      </h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={onSubmit} className="w-full flex flex-col gap-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Nome
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Senha
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => onFieldChange("password", e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-smalltext dark:text-darksmalltext"
          >
            Confirmar Senha
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-inputtextfocus focus:border-inputtextfocusborder border bg-inputtext border-inputtextborder dark:bg-darkinputtext dark:border-darkinputtextborder dark:text-darkinputtextdarktext disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sinapgreen-500 text-white py-2 px-4 rounded-md hover:bg-sinapgreen-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      <p className="mt-4 text-sm text-smalltext dark:text-darksmalltext">
        Já tem uma conta?{" "}
        <Link
          to="/login"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Faça login
        </Link>
      </p>
    </div>
  );
};

export default SignupForm;
