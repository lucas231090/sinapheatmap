import React from "react";

function LoggedOutHeader() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <h1>Bem-vindo ao Site!</h1>
      <nav>
        <a href="/login">Login</a> | <a href="/register">Registrar</a>
      </nav>
    </header>
  );
}

export default LoggedOutHeader;
