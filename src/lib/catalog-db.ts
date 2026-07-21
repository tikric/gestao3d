import { openDB, type IDBPDatabase } from "idb";

export type ModelRecord = {
  id: string;
  name: string;
  fileName: string;
  fileType: "stl" | "3mf";
  size: number;
  hash: string;
  category: string;
  tags: string[];
  notes: string;
  unit: "mm" | "inch";
  scale: number;
  thumbnail?: string; // data URL
  referenceImage?: string; // data URL or URL
  source?: { name: string; url: string };
  createdAt: number;
  updatedAt: number;
};

const DB_NAME = "imprimetrics-catalog";
const DB_VERSION = 1;

async function db(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(d: IDBPDatabase) {
      if (!d.objectStoreNames.contains("models")) {
        d.createObjectStore("models", { keyPath: "id" });
      }
      if (!d.objectStoreNames.contains("files")) {
        d.createObjectStore("files");
      }
    },
  });
}

export async function listModels(): Promise<ModelRecord[]> {
  const d = await db();
  const all = (await d.getAll("models")) as ModelRecord[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getModel(id: string): Promise<ModelRecord | undefined> {
  const d = await db();
  return d.get("models", id);
}

export async function getFile(id: string): Promise<Blob | undefined> {
  const d = await db();
  return d.get("files", id);
}

export async function saveModel(rec: ModelRecord, file?: Blob): Promise<void> {
  const d = await db();
  const tx = d.transaction(["models", "files"], "readwrite");
  await tx.objectStore("models").put(rec);
  if (file) await tx.objectStore("files").put(file, rec.id);
  await tx.done;
}

export async function deleteModel(id: string): Promise<void> {
  const d = await db();
  const tx = d.transaction(["models", "files"], "readwrite");
  await tx.objectStore("models").delete(id);
  await tx.objectStore("files").delete(id);
  await tx.done;
}

export async function findByHash(hash: string): Promise<ModelRecord | undefined> {
  const all = await listModels();
  return all.find((m) => m.hash === hash);
}

export async function hashFile(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const CATEGORIES = [
  "Decoração",
  "Funcional",
  "Brinquedos",
  "Cosplay",
  "Ferramentas",
  "Miniaturas",
  "Peças de reposição",
  "Outro",
] as const;
