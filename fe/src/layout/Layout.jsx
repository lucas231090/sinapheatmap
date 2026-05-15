import LoggedInHeader from "@/layout/LoggedInHeader";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import useLayout from "@/hooks/useLayout";
import { Outlet } from "react-router-dom";

/**
 * Componente de Layout Principal
 * Responsável apenas pela apresentação da estrutura da aplicação
 * Toda a lógica está separada no hook useLayout
 */
function Layout({ children }) {
  // Hook centralizado para lógica do layout
  const { darkMode, toggleDarkMode, isLoggedIn, handleLogout } = useLayout();

  // Componente do botão de modo escuro
  const darkModeButton = (
    <button
      onClick={toggleDarkMode}
      className="bg-gray-800 dark:bg-gray-200 text-white dark:text-black p-2 rounded-3xl flex items-center "
    >
      {darkMode ? <WbSunnyIcon /> : <DarkModeIcon />}
    </button>
  );

  return (
    <div className="bg-bg dark:bg-darkbg min-h-screen flex flex-col">
      <header>
        <nav>
          <div className="nav-links">
            {isLoggedIn ? (
              <>
                <LoggedInHeader
                  body={
                    <>
                      <div className="flex flex-row items-center justify-end w-full px-7 gap-4">
                        {darkModeButton}
                        <button
                          onClick={handleLogout}
                          className="bg-gray-800 dark:bg-gray-200 text-white dark:text-black p-2 rounded-3xl flex items-center "
                        >
                          <ExitToAppIcon />
                        </button>
                      </div>
                    </>
                  }
                />
              </>
            ) : (
              <>
                <div className="absolute right-10 top-10">{darkModeButton}</div>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="m-4 h-max flex flex-col flex-grow rounded-lg bg-gradient-to-l bg-radial-[at_50%_55%] to-bgoffcolor  from-bg from-40%  dark:to-darkbg dark:from-darkbgoffcolor ">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
