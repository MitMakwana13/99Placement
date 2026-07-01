import { createFileRoute } from "@tanstack/react-router";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
import JSZip from "jszip";

const EXCLUDE_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".output",
  ".nitro",
  ".cache",
  ".temp",
  "bun.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
]);

async function collectFiles(
  dir: string,
  root: string
): Promise<Array<{ absolute: string; relative: string }>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: Array<{ absolute: string; relative: string }> = [];

  for (const entry of entries) {
    // Skip hidden files/folders except the .lovable config directory.
    if (entry.name.startsWith(".") && entry.name !== ".lovable") continue;
    if (EXCLUDE_NAMES.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    const relPath = relative(root, fullPath);

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, root);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push({ absolute: fullPath, relative: relPath });
    }
  }

  return files;
}

export const Route = createFileRoute("/api/public/download-codebase")({
  server: {
    handlers: {
      GET: async () => {
        const root = process.cwd();

        try {
          await stat(join(root, "package.json"));
        } catch {
          return new Response(
            "Codebase download is only available in the development/preview environment.",
            { status: 404, headers: { "Content-Type": "text/plain" } }
          );
        }

        const files = await collectFiles(root, root);
        const zip = new JSZip();

        for (const file of files) {
          const content = await readFile(file.absolute);
          zip.file(file.relative, content);
        }

        const buffer = await zip.generateAsync({ type: "nodebuffer" });
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="talentlab-codebase.zip"`,
            "Content-Length": String(bytes.length),
          },
        });
      },
    },
  },
});
