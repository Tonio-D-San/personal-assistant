import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const OUTPUT_DIR = path.resolve(process.cwd(), "generated-markdown");

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.trim().replace(/[^a-zA-Z0-9-_]/g, "-");
  return cleaned.endsWith(".md") ? cleaned : `${cleaned}.md`;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (req.method === "POST" && req.url === "/api/markdown") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body) as { text?: unknown; fileName?: unknown };
        const text = parsed.text;
        const rawFileName = parsed.fileName;

        if (typeof text !== "string" || text.trim().length === 0) {
          return sendJson(res, 400, {
            error: "Il campo 'text' è obbligatorio e deve essere una stringa non vuota.",
          });
        }

        const finalFileName =
          typeof rawFileName === "string" && rawFileName.trim().length > 0
            ? sanitizeFileName(rawFileName)
            : `note-${Date.now()}.md`;

        const fullPath = path.join(OUTPUT_DIR, finalFileName);

        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        await fs.writeFile(fullPath, text, "utf8");

        return sendJson(res, 201, {
          message: "File markdown creato con successo.",
          fileName: finalFileName,
          path: fullPath,
        });
      } catch (error) {
        console.error("Errore nella creazione del file markdown:", error);
        return sendJson(res, 500, { error: "Errore interno del server." });
      }
    });

    return;
  }

  return sendJson(res, 404, { error: "Endpoint non trovato." });
});

server.listen(PORT, () => {
  console.log(`Server backend in ascolto su http://localhost:${PORT}`);
});
