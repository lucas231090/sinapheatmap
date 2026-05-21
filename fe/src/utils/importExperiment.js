const DEFAULT_SCREEN_WIDTH = 1280;
const DEFAULT_SCREEN_HEIGHT = 720;

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

const normalizeKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const splitLine = (line, delimiter) => {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const detectDelimiter = (line = "") => {
  const candidates = [";", ",", "\t", "|"];

  return candidates
    .map((delimiter) => ({
      delimiter,
      count: line.split(delimiter).length,
    }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
};

const aliasLookup = (row, aliases) => {
  const normalizedRow = Object.entries(row).reduce(
    (accumulator, [key, value]) => {
      accumulator[normalizeKey(key)] = value;
      return accumulator;
    },
    {},
  );

  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const value = normalizedRow[normalizedAlias];

    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
};

const parseNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return Number.NaN;
  }

  const normalized = String(value).replace(",", ".").trim();
  return Number(normalized);
};

export const parseDelimitedCsv = (text) => {
  const normalizedText = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], rows: [], delimiter: ";" };
  }

  const delimiter = detectDelimiter(lines[0]);
  const parsedRows = lines.map((line) => splitLine(line, delimiter));
  const headers = parsedRows.shift() || [];

  const rows = parsedRows.map((cells) => {
    const row = {};

    headers.forEach((header, index) => {
      row[header || `column_${index + 1}`] = cells[index] || "";
    });

    return row;
  });

  return { headers, rows, delimiter };
};

export const buildImportedSessionsFromCsv = (text) => {
  const { headers, rows } = parseDelimitedCsv(text);
  const groups = new Map();
  let totalPoints = 0;
  let screenWidth = DEFAULT_SCREEN_WIDTH;
  let screenHeight = DEFAULT_SCREEN_HEIGHT;

  rows.forEach((row, index) => {
    const x = parseNumber(
      aliasLookup(row, [
        "x",
        "posicao x",
        "posição x",
        "coordx",
        "coordenadax",
        "xcoord",
        "left",
      ]),
    );
    const y = parseNumber(
      aliasLookup(row, [
        "y",
        "posicao y",
        "posição y",
        "coordy",
        "coordenaday",
        "ycoord",
        "top",
      ]),
    );

    if (Number.isNaN(x) || Number.isNaN(y)) {
      return;
    }

    const sessionId =
      aliasLookup(row, [
        "sessao_id",
        "sessao",
        "session_id",
        "session",
        "id_sessao",
      ]) ||
      aliasLookup(row, ["participante", "participant", "nome", "name"]) ||
      "imported-1";
    const participantName =
      aliasLookup(row, ["participante", "participant", "nome", "name"]) ||
      `Participante ${groups.size + 1}`;
    const timestamp = parseNumber(
      aliasLookup(row, ["timestamp", "tempo", "time", "ms"]),
    );
    const frame = parseNumber(aliasLookup(row, ["frame", "quadro"]));

    const screenWidthValue = parseNumber(
      aliasLookup(row, [
        "largura tela",
        "largura_tela",
        "screenwidth",
        "width",
      ]),
    );
    const screenHeightValue = parseNumber(
      aliasLookup(row, [
        "altura tela",
        "altura_tela",
        "screenheight",
        "height",
      ]),
    );

    if (!Number.isNaN(screenWidthValue) && screenWidthValue > 0) {
      screenWidth = screenWidthValue;
    }

    if (!Number.isNaN(screenHeightValue) && screenHeightValue > 0) {
      screenHeight = screenHeightValue;
    }

    if (!groups.has(sessionId)) {
      groups.set(sessionId, {
        sessao_id: sessionId,
        participante: { nome: participantName },
        coordinates: [],
      });
    }

    const group = groups.get(sessionId);
    if (!group.participante?.nome && participantName) {
      group.participante = { nome: participantName };
    }

    group.coordinates.push({
      x,
      y,
      value: 50,
      timestamp: Number.isNaN(timestamp) ? index : timestamp,
      frame: Number.isNaN(frame) ? index : frame,
    });
    totalPoints += 1;
  });

  return {
    headers,
    totalPoints,
    screenWidth,
    screenHeight,
    sessions: Array.from(groups.values()),
  };
};

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(reader.error || new Error("Falha ao ler o arquivo de mídia."));
    };

    reader.readAsDataURL(file);
  });
