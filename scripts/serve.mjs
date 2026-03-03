import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 8788);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function safePath(urlPath) {
  const clean = urlPath.split("?")[0].replace(/\/+$/, "") || "/";
  const file = clean === "/" ? "/index.html" : clean;
  return resolve(join(root, file));
}

createServer(async (req, res) => {
  try {
    const fullPath = safePath(req.url || "/");
    if (!fullPath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const info = await stat(fullPath);
    if (!info.isFile()) throw new Error("Not a file");

    const body = await readFile(fullPath);
    res.writeHead(200, { "content-type": types[extname(fullPath)] || "text/plain" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`NurseApp local server: http://127.0.0.1:${port}`);
});
