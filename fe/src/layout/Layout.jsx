import React, { use, useState, useEffect, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoggedInHeader from "./LoggedInHeader";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

function Layout({ children }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const darkModeButton = (
    <button
      onClick={toggleDarkMode}
      className="bg-gray-800 dark:bg-gray-200 text-white dark:text-black p-2 rounded-3xl flex items-center "
    >
      {darkMode ? <WbSunnyIcon /> : <DarkModeIcon />}
    </button>
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        {children}
      </main>
    </div>
  );
}

export default Layout;
