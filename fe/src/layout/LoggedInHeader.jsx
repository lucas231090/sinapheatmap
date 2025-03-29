import React from "react";

function LoggedInHeader() {
  return (
    <header className="bg-white text-black flex flex-row justify-start p-4 items-center">
      <nav>
        <a href="/">
          <img
            src={"SinapsenseLogo.png"}
            alt="Sinapsense Logo"
            className="h-25 w-auto mr-4"
          />
        </a>
      </nav>
    </header>
  );
}

export default LoggedInHeader;
