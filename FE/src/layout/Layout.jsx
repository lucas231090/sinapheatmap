import React from "react";
import { useLocation } from "react-router-dom";
import LoggedInHeader from "./LoggedInHeader";
import LoggedOutHeader from "./LoggedOutHeader";

function Layout({ children, isLoggedIn }) {
  const location = useLocation();

  // Escolher o Header com base no estado do usuário ou na rota
  const renderHeader = () => {
    if (isLoggedIn) {
      return <LoggedInHeader />;
    }
    return <LoggedOutHeader />;
  };

  return (
    <div>
      {renderHeader()}
      <main>{children}</main>
    </div>
  );
}

export default Layout;
