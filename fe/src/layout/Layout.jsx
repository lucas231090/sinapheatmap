import React, { use, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoggedInHeader from "./LoggedInHeader";
import LoggedOutHeader from "./LoggedOutHeader";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
function Layout({ children, isLoggedIn }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

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

  // Escolher o Header com base no estado do usuário ou na rota
  const renderHeader = () => {
    if (isLoggedIn) {
      return <LoggedInHeader body={darkModeButton} />;
    }
    return <LoggedOutHeader />;
  };

  return (
    <div className="bg-white dark:bg-gray-700 min-h-screen flex flex-col">
      <div className="">{renderHeader()}</div>
      <main className="m-4 h-max flex flex-col flex-grow rounded-lg bg-gradient-to-l bg-radial-[at_50%_55%] to-green-300 dark:to-black from-white dark:from-gray-600 from-40% ">
        {children}
      </main>
    </div>
  );
}

export default Layout;
