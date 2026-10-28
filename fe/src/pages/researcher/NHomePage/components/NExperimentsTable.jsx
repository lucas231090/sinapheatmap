import { useEffect, useMemo, useRef, useState, useReducer } from "react";
import { Link } from "react-router-dom";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { updateExperimentStatus } from "@/services/eyetrackingService";
import Button from "@/components/general/Button";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "imported", label: "Importados" },
];

const SORTABLE_COLUMNS = {
  name: "Nome",
  description: "Descrição",
  startDate: "Início",
  endDate: "Fim",
  participantsCount: "Participantes",
  createdBy: "Criado por",
  status: "Status",
};

function getStatusMeta(experiment) {
  if (experiment.isImported) {
    return {
      label: "Importado",
      className: "bg-amber-100 text-amber-900",
    };
  }

  if (experiment.active) {
    return {
      label: "Ativo",
      className: "bg-emerald-100 text-emerald-900",
    };
  }

  return {
    label: "Inativo",
    className: "bg-red-100 text-red-900",
  };
}

function normalizeDateValue(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getTime();
}

function compareValues(leftValue, rightValue, direction) {
  const leftNumber = normalizeDateValue(leftValue);
  const rightNumber = normalizeDateValue(rightValue);

  if (leftNumber !== null && rightNumber !== null) {
    return direction === "asc"
      ? leftNumber - rightNumber
      : rightNumber - leftNumber;
  }

  const leftText = String(leftValue || "").toLowerCase();
  const rightText = String(rightValue || "").toLowerCase();

  return direction === "asc"
    ? leftText.localeCompare(rightText, "pt-BR")
    : rightText.localeCompare(leftText, "pt-BR");
}

function sortExperiments(experiments, sortKey, sortDirection) {
  if (!sortKey || !sortDirection) {
    return [...experiments];
  }

  const direction = sortDirection === "desc" ? "desc" : "asc";

  return experiments.toSorted((left, right) => {
    if (sortKey === "status") {
      const leftRank = left.isImported ? 2 : left.active ? 0 : 1;
      const rightRank = right.isImported ? 2 : right.active ? 0 : 1;
      return direction === "asc" ? leftRank - rightRank : rightRank - leftRank;
    }

    if (sortKey === "participantsCount") {
      return direction === "asc"
        ? (left.participantsCount || 0) - (right.participantsCount || 0)
        : (right.participantsCount || 0) - (left.participantsCount || 0);
    }

    if (sortKey === "startDate") {
      return compareValues(
        left.startDateValue,
        right.startDateValue,
        direction,
      );
    }

    if (sortKey === "endDate") {
      return compareValues(left.endDateValue, right.endDateValue, direction);
    }

    return compareValues(left[sortKey], right[sortKey], direction);
  });
}

function ActionButton({ title, onClick, disabled, children, className = "" }) {
  return (
    <Button
      variant="secondary"
      size="icon"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
}

function ActionLink({ title, to, children, className = "" }) {
  return (
    <Button
      asLink
      to={to}
      variant="secondary"
      size="icon"
      title={title}
      className={className}
    >
      {children}
    </Button>
  );
}

const tableQueryReducer = (state, action) => {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case "SET_STATUS_FILTER":
      return {
        ...state,
        statusFilter: action.payload,
        statusMenuOpen: false,
        currentPage: 1,
      };
    case "SET_STATUS_MENU_OPEN":
      return { ...state, statusMenuOpen: action.payload };
    case "SET_SORT":
      return {
        ...state,
        sortKey: action.payload.sortKey,
        sortDirection: action.payload.sortDirection,
        currentPage: 1,
      };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "RESET_FILTERS":
      return {
        ...state,
        searchTerm: "",
        statusFilter: "all",
        statusMenuOpen: false,
        sortKey: "",
        sortDirection: "",
        currentPage: 1,
      };
    default:
      return state;
  }
};

function SortableHeader({
  columnKey,
  label,
  sortKey,
  sortDirection,
  onSort,
  alignClass = "",
}) {
  const isActive = sortKey === columnKey && Boolean(sortDirection);
  const icon =
    sortKey !== columnKey || !sortDirection ? null : sortDirection === "asc" ? (
      <ArrowUpwardIcon fontSize="inherit" />
    ) : (
      <ArrowDownwardIcon fontSize="inherit" />
    );

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={`inline-flex items-center gap-1 text-left transition hover:text-black dark:hover:text-white ${alignClass} ${
        isActive
          ? "text-black dark:text-white"
          : "text-slate-700 dark:text-slate-300"
      }`}
      title={
        sortKey === columnKey && sortDirection === "asc"
          ? `${label}: crescente`
          : sortKey === columnKey && sortDirection === "desc"
            ? `${label}: decrescente`
            : `${label}: sem ordenação`
      }
      aria-label={`Ordenar por ${label}`}
    >
      <span>{label}</span>
      {icon}
    </button>
  );
}

const buildTestLink = (experimentId) => {
  if (typeof window === "undefined") {
    return `/test/${experimentId}`;
  }

  return `${window.location.origin}/test/${experimentId}`;
};

function useExperimentsTable(experiments) {
  const [queryState, dispatch] = useReducer(tableQueryReducer, {
    searchTerm: "",
    statusFilter: "all",
    statusMenuOpen: false,
    sortKey: "",
    sortDirection: "",
    currentPage: 1,
  });

  const {
    searchTerm,
    statusFilter,
    statusMenuOpen,
    sortKey,
    sortDirection,
    currentPage,
  } = queryState;

  const statusMenuRef = useRef(null);
  const pageSize = 10;

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target)
      ) {
        dispatch({ type: "SET_STATUS_MENU_OPEN", payload: false });
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const filteredExperiments = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return experiments.filter((experiment) => {
      const matchesSearch = normalizedSearchTerm
        ? [
            experiment.name,
            experiment.description,
            experiment.startDate,
            experiment.endDate,
            experiment.participantsCount,
            getStatusMeta(experiment).label,
          ]
            .filter((value) => value !== null && value !== undefined)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedSearchTerm),
            )
        : true;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? experiment.active && !experiment.isImported
            : statusFilter === "inactive"
              ? !experiment.active && !experiment.isImported
              : statusFilter === "imported"
                ? experiment.isImported
                : true;

      return matchesSearch && matchesStatus;
    });
  }, [experiments, searchTerm, statusFilter]);

  const sortedExperiments = useMemo(() => {
    return sortExperiments(filteredExperiments, sortKey, sortDirection);
  }, [filteredExperiments, sortDirection, sortKey]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedExperiments.length / pageSize),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const visibleExperiments = sortedExperiments.slice(
    pageStart,
    pageStart + pageSize,
  );

  const startItem = sortedExperiments.length ? pageStart + 1 : 0;
  const endItem = Math.min(pageStart + pageSize, sortedExperiments.length);

  const handleSearchChange = (event) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: event.target.value });
  };

  const chooseStatusFilter = (value) => {
    dispatch({ type: "SET_STATUS_FILTER", payload: value });
  };

  const resetFilters = () => {
    dispatch({ type: "RESET_FILTERS" });
  };

  const handleHeaderSort = (columnKey) => {
    let nextSortKey = sortKey;
    let nextSortDirection = sortDirection;

    if (sortKey !== columnKey) {
      nextSortKey = columnKey;
      nextSortDirection = "asc";
    } else if (sortDirection === "asc") {
      nextSortDirection = "desc";
    } else if (sortDirection === "desc") {
      nextSortKey = "";
      nextSortDirection = "";
    } else {
      nextSortDirection = "asc";
    }

    dispatch({
      type: "SET_SORT",
      payload: { sortKey: nextSortKey, sortDirection: nextSortDirection },
    });
  };

  const goToPage = (pageNumber) => {
    dispatch({
      type: "SET_PAGE",
      payload: Math.min(Math.max(pageNumber, 1), totalPages),
    });
  };

  const paginationPages = useMemo(() => {
    const pages = [];
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    const startPage = Math.max(1, safeCurrentPage - halfWindow);
    const endPage = Math.min(totalPages, startPage + windowSize - 1);
    const adjustedStart = Math.max(1, endPage - windowSize + 1);

    for (let page = adjustedStart; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  return {
    searchTerm,
    statusFilter,
    statusMenuOpen,
    sortKey,
    sortDirection,
    currentPage,
    statusMenuRef,
    pageSize,
    sortedExperiments,
    visibleExperiments,
    totalPages,
    safeCurrentPage,
    startItem,
    endItem,
    dispatch,
    handleSearchChange,
    chooseStatusFilter,
    resetFilters,
    handleHeaderSort,
    goToPage,
    paginationPages,
  };
}

function NExperimentsTableToolbar({
  searchTerm,
  statusFilter,
  statusMenuOpen,
  sortedExperiments,
  startItem,
  endItem,
  pageSize,
  statusMenuRef,
  dispatch,
  handleSearchChange,
  chooseStatusFilter,
  resetFilters,
}) {
  const currentStatusLabel =
    STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
      ?.label || "Todos";

  return (
    <div className="mt-5 grid gap-4 rounded-[1.5rem] bg-slate-50 dark:bg-gray-700 p-4 xl:grid-cols-[minmax(0,1fr)_max-content]">
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm">
        <SearchIcon
          className="text-slate-500 dark:text-slate-400"
          fontSize="small"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar por nome, descrição, data ou participantes"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-black dark:text-white"
        />
      </label>

      <div ref={statusMenuRef} className="relative">
        <div className="flex items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-1 items-center gap-3 px-4 py-3 pointer-events-none">
            <FilterAltIcon
              className="text-slate-500 dark:text-slate-400"
              fontSize="small"
            />
            <span className="text-sm font-medium text-black dark:text-white">
              {currentStatusLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "SET_STATUS_MENU_OPEN",
                payload: !statusMenuOpen,
              })
            }
            className="inline-flex items-center justify-center border-l border-slate-200 px-4 text-black dark:text-white transition hover:bg-slate-50"
            title="Abrir filtro"
            aria-label="Abrir filtro"
          >
            <ArrowDropDownIcon fontSize="small" />
          </button>
        </div>

        {statusMenuOpen ? (
          <div className="absolute right-0 z-20 mt-2 w-full min-w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-gray-800 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
            {STATUS_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseStatusFilter(option.value)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                  statusFilter === option.value
                    ? "font-semibold text-black dark:text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{option.label}</span>
                {statusFilter === option.value ? (
                  <CheckIcon fontSize="inherit" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="flex items-center text-sm text-slate-600 dark:text-slate-400">
        Mostrando {startItem} - {endItem} de {sortedExperiments.length} teste
        {sortedExperiments.length === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Máximo de {pageSize} itens por página
        </p>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

function NExperimentsTablePagination({
  safeCurrentPage,
  totalPages,
  isLoading,
  goToPage,
  paginationPages,
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Página {safeCurrentPage} de {totalPages}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1 || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-black dark:text-white shadow-sm transition hover:bg-slate-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeftIcon fontSize="small" />
          Anterior
        </button>

        {paginationPages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => goToPage(pageNumber)}
            className={`inline-flex min-w-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              pageNumber === safeCurrentPage
                ? "bg-sinapgreen-500 text-black"
                : "border border-slate-200 bg-white text-black hover:bg-slate-50"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-black dark:text-white shadow-sm transition hover:bg-slate-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
          <ChevronRightIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

export default function NExperimentsTable({
  experiments,
  isLoading,
  error,
  onRefresh,
}) {
  const [busyExperimentId, setBusyExperimentId] = useState("");
  const [copiedExperimentId, setCopiedExperimentId] = useState("");

  const {
    searchTerm,
    statusFilter,
    statusMenuOpen,
    sortKey,
    sortDirection,
    statusMenuRef,
    pageSize,
    sortedExperiments,
    visibleExperiments,
    totalPages,
    safeCurrentPage,
    startItem,
    endItem,
    dispatch,
    handleSearchChange,
    chooseStatusFilter,
    resetFilters,
    handleHeaderSort,
    goToPage,
    paginationPages,
  } = useExperimentsTable(experiments);

  const handleCopyLink = async (experimentId) => {
    try {
      const link = buildTestLink(experimentId);
      await navigator.clipboard.writeText(link);
      setCopiedExperimentId(experimentId);
      window.setTimeout(() => {
        setCopiedExperimentId((current) =>
          current === experimentId ? "" : current,
        );
      }, 1800);
    } catch (copyError) {
      console.error("NExperimentsTable copy error:", copyError);
      window.alert("Nao foi possivel copiar o link do teste.");
    }
  };

  const handleToggleStatus = async (experiment) => {
    setBusyExperimentId(experiment.id);

    try {
      await updateExperimentStatus(experiment.id, !experiment.active);
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (toggleError) {
      console.error("NExperimentsTable toggle error:", toggleError);
      window.alert("Nao foi possivel alterar o status do teste.");
    } finally {
      setBusyExperimentId("");
    }
  };

  const handleDelete = async (experiment) => {
    if (
      !window.confirm(
        "Tem certeza que deseja deletar este experimento? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setBusyExperimentId(experiment.id);

    try {
      const { deleteExperiment } =
        await import("@/services/eyetrackingService");
      await deleteExperiment(experiment.id);
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (deleteError) {
      console.error("NExperimentsTable delete error:", deleteError);
      window.alert("Nao foi possivel deletar o teste.");
    } finally {
      setBusyExperimentId("");
    }
  };

  return (
    <section className="rounded-[2rem] bg-white dark:bg-slate-800 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-sinapgreen-900 dark:text-sinapgreen-500">
            Testes criados
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-black dark:text-white sm:text-3xl">
            Tabela de experimentos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof onRefresh === "function") {
              onRefresh();
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-50"
        >
          <RefreshIcon fontSize="small" />
          Atualizar
        </button>
      </div>

      <NExperimentsTableToolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        statusMenuOpen={statusMenuOpen}
        sortedExperiments={sortedExperiments}
        startItem={startItem}
        endItem={endItem}
        pageSize={pageSize}
        statusMenuRef={statusMenuRef}
        dispatch={dispatch}
        handleSearchChange={handleSearchChange}
        chooseStatusFilter={chooseStatusFilter}
        resetFilters={resetFilters}
      />

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100 dark:bg-gray-700 text-left text-xs font-bold uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="name"
                    label={SORTABLE_COLUMNS.name}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="description"
                    label={SORTABLE_COLUMNS.description}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="startDate"
                    label={SORTABLE_COLUMNS.startDate}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="endDate"
                    label={SORTABLE_COLUMNS.endDate}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="participantsCount"
                    label={SORTABLE_COLUMNS.participantsCount}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="createdBy"
                    label={SORTABLE_COLUMNS.createdBy}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3">
                  <SortableHeader
                    columnKey="status"
                    label={SORTABLE_COLUMNS.status}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleHeaderSort}
                  />
                </th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:bg-slate-800">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    Carregando testes criados...
                  </td>
                </tr>
              ) : visibleExperiments.length ? (
                visibleExperiments.map((experiment) => (
                  <ExperimentRow
                    key={experiment.id}
                    experiment={experiment}
                    copiedExperimentId={copiedExperimentId}
                    busyExperimentId={busyExperimentId}
                    onCopyLink={handleCopyLink}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                    Nenhum teste encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NExperimentsTablePagination
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        goToPage={goToPage}
        paginationPages={paginationPages}
      />
    </section>
  );
}

function ExperimentRow({
  experiment,
  copiedExperimentId,
  busyExperimentId,
  onCopyLink,
  onToggleStatus,
  onDelete,
}) {
  const statusMeta = getStatusMeta(experiment);
  const copyTitle =
    copiedExperimentId === experiment.id ? "Link copiado" : "Copiar link";
  const isBusy = busyExperimentId === experiment.id;

  return (
    <tr className="align-top text-sm text-black dark:text-white">
      <td className="px-4 py-4 font-semibold">{experiment.name}</td>
      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
        {experiment.description || "-"}
      </td>
      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
        {experiment.startDate || "-"}
      </td>
      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
        {experiment.endDate || "-"}
      </td>
      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 ">
        {experiment.participantsCount ?? 0}
      </td>
      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
        {experiment.createdBy || "-"}
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          {!experiment.isImported ? (
            <>
              <ActionButton
                title={copyTitle}
                onClick={() => onCopyLink(experiment.id)}
              >
                {copiedExperimentId === experiment.id ? (
                  <CheckIcon fontSize="small" />
                ) : (
                  <ContentCopyIcon fontSize="small" />
                )}
              </ActionButton>

              <ActionButton
                title={experiment.active ? "Desativar" : "Ativar"}
                onClick={() => onToggleStatus(experiment)}
                disabled={isBusy}
                className={
                  experiment.active
                    ? "text-emerald-700 dark:text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-500"
                    : "text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400"
                }
              >
                <PowerSettingsNewIcon fontSize="small" />
              </ActionButton>
            </>
          ) : null}
          <ActionLink
            title="Ver resultados"
            to={`/heatmap/${experiment.id}`}
            className="text-blue-600 hover:text-blue-700"
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </ActionLink>

          <ActionLink
            title="Editar"
            to={`/edit/${experiment.id}`}
            className="text-sinapgreen-700 hover:text-sinapgreen-800"
          >
            <EditOutlinedIcon fontSize="small" />
          </ActionLink>

          <ActionButton
            title="Deletar"
            onClick={() => onDelete(experiment)}
            disabled={isBusy}
            className="text-red-600 hover:text-red-700"
          >
            <DeleteOutlineIcon fontSize="small" />
          </ActionButton>
        </div>
      </td>
    </tr>
  );
}
