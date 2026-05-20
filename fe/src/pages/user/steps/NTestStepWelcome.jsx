import { useState } from "react";

export default function NTestStepWelcome({ experiment, onNext }) {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");

  const ident = experiment?.identification || { mode: "nome", required: true };
  const askNome = ident.mode.includes("nome");
  const askCpf = ident.mode.includes("cpf");

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ nome, cpf });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#1e293b] p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">{experiment.basic?.name}</h1>
      <p className="text-lg text-slate-300 mb-8 max-w-2xl">
        {experiment.basic?.description}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md bg-white text-black p-6 rounded-xl shadow-lg"
      >
        {askNome && (
          <input
            type="text"
            placeholder="Seu Nome Completo"
            required={ident.required}
            className="p-3 border rounded"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}
        {askCpf && (
          <input
            type="text"
            placeholder="Seu CPF"
            required={ident.required}
            className="p-3 border rounded"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        )}
        <button
          type="submit"
          className="bg-sinapgreen-500 font-bold p-3 rounded-full hover:bg-sinapgreen-800 transition mt-2"
        >
          Iniciar Experimento
        </button>
      </form>
    </div>
  );
}
