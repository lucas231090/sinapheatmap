import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { validateSignInForm } from "@/utils/authValidation";

import { useTheme } from "@/hooks/useTheme";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import logoImage from "@/assets/logotransparente.png";
import LogoSinapsense from "@/assets/logo_sinapsense 1.png";

function NSignInPage() {
  const navigate = useNavigate();
  const { signIn, isLoading, isAuthenticated, hasHydrated } = useAuth();
  const { notifyError, notifySuccess } = useNotifications();
  const { isDark } = useTheme();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

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

  const handleInputChange = (event) => {
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
      notifyError("Preencha os campos obrigatórios para continuar.");
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
    <div className="flex flex-row text-center w-full h-full items-center justify-between">
      <div className="hidden lg:flex flex-col h-min p-20 gap-10 bg-black/50 rounded-e-xl">
        <img src={logoImage} alt="Logo Transparente" className="w-[400px]" />
        <div className="flex flex-col gap-4 items-start text-white">
          <h1 className="font-bold text-6xl">SINAPEYE</h1>
          <h1 className="text-5xl">Sistema de Eyetracking</h1>
        </div>
      </div>
      
      <div className="rounded-s-2xl bg-white dark:bg-slate-800 shadow-lg flex flex-col px-10 md:px-15 w-full lg:w-auto min-h-screen justify-center transition-colors">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col items-center justify-center gap-10 py-10"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src={LogoSinapsense}
              alt="Logo Sinapsense"
              className="w-16 h-16"
            />
            <button 
              type="button" 
              onClick={toggleDarkMode}
              className="bg-black dark:bg-white text-white dark:text-black rounded-full w-14 h-14 p-2 hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              {isDark ? <WbSunnyIcon /> : <DarkModeIcon />}
            </button>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-96">
            <label
              htmlFor="email"
              className="text-sm font-bold text-black dark:text-white text-left transition-colors"
            >
              EMAIL
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`border bg-gray-200 dark:bg-slate-700 rounded-md p-3 text-black dark:text-white transition-colors focus:outline-none focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500 ${errors.email ? 'border-red-500' : 'border-black dark:border-slate-500'}`}
            />
            {errors.email && <span className="text-red-500 text-xs text-left">{errors.email}</span>}
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-96">
            <label
              htmlFor="password"
              className="text-sm font-bold text-black dark:text-white text-left transition-colors"
            >
              SENHA
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`border bg-gray-200 dark:bg-slate-700 rounded-md p-3 text-black dark:text-white transition-colors focus:outline-none focus:border-sinapgreen-500 focus:ring-1 focus:ring-sinapgreen-500 ${errors.password ? 'border-red-500' : 'border-black dark:border-slate-500'}`}
            />
            {errors.password && <span className="text-red-500 text-xs text-left">{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-60 bg-[#00BED5] text-white hover:bg-[#00a8bc] w-auto self-center mt-4"
          >
            {isLoading ? "ENTRANDO..." : "FAZER LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NSignInPage;
