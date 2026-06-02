import { Link } from "react-router-dom";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import NExperimentsTable from "@/pages/researcher/NHomePage/components/NExperimentsTable";
import { useNHomePage } from "@/hooks/useNHomePage";

import Card from "@/components/general/Card";
import Button from "@/components/general/Button";

function NHomePage() {
  const { experiments, isLoading, error, refresh } = useNHomePage();

  return (
    <section className="flex flex-col gap-10">
      <Card>
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-sinapgreen-900 dark:text-sinapgreen-500">
            Painel do pesquisador
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-black dark:text-white sm:text-4xl lg:text-5xl">
            Página inicial
          </h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Acompanhe os testes criados, crie novos experimentos e importe dados
            sem sair da visão geral.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Button
            asLink
            to="/create"
            variant="secondary"
            className="h-full min-h-20 px-6 py-5 text-base hover:-translate-y-0.5 hover:shadow-lg rounded-[1.5rem]"
          >
            <AddCircleOutlineIcon fontSize="small" />
            Criar experimento
          </Button>
          <Button
            asLink
            to="/import"
            variant="secondary"
            className="h-full min-h-20 px-6 py-5 text-base hover:-translate-y-0.5 hover:shadow-lg rounded-[1.5rem]"
          >
            <FileUploadIcon fontSize="small" />
            Importar teste
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-10">
        <NExperimentsTable
          experiments={experiments}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
        />
      </div>
    </section>
  );
}

export default NHomePage;
