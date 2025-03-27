import React from "react";

function LoggedInHeader() {
  return (
    <header className="bg-blue-500 text-white p-4">
      <h1>Bem-vindo, Usuário!</h1>
      <nav>
        <a href="/dashboard">Dashboard</a> | <a href="/logout">Logout</a>
      </nav>
    </header>
  );
}

export default LoggedInHeader;
