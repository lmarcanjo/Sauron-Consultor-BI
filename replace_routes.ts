import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const marker = "// -------------------------------------------------------------\n// ENDPOINTS DE API (Sempre registrados primeiro)\n// -------------------------------------------------------------";

const endMarker = "// Paths para persistência de dados no servidor\nconst DB_CONFIG_FILE";

const startIndex = content.indexOf(marker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newEndpoints = `
${marker}

// Testar conexão detalhada por etapas
app.post("/api/db/test-connection", async (req, res) => {
  try {
    const result = await databaseConnectionManager.testConnection(req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro de conexão com o banco de dados." });
  }
});

// Listar tabelas (usado para preview e map)
app.post("/api/db/list-tables", async (req, res) => {
  try {
    const result = await databaseConnectionManager.getTablesAndColumns(req.body);
    return res.json({ success: true, tables: result.tables, estimatedRows: result.estimatedRows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro ao listar tabelas." });
  }
});

// Listar colunas
app.post("/api/db/list-columns", async (req, res) => {
  try {
    const result = await databaseConnectionManager.getTablesAndColumns(req.body);
    return res.json({ success: true, tableColumns: result.tableColumns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro ao listar colunas." });
  }
});

// Buscar registros
app.post("/api/db/fetch", async (req, res) => {
  try {
    const data = await databaseConnectionManager.executeFetchAndMap(req.body);
    return res.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro ao carregar dados do banco de dados." });
  }
});

`;

  const newContent = content.substring(0, startIndex) + newEndpoints + content.substring(endIndex);
  fs.writeFileSync('server.ts', newContent);
  console.log("Substituição feita com sucesso.");
} else {
  console.log("Não foi possível encontrar os marcadores. Start: " + startIndex + " End: " + endIndex);
}
