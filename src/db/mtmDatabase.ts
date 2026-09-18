import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import seedSql from "./seed.sql?raw";

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function initializeDatabase() {
  if (db) return db;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("Initializing database...");

    const SQL = await initSqlJs({
      locateFile: () => wasmUrl,
    });

    const database = new SQL.Database();

    database.run(seedSql);

    db = database;

    console.log("Database initialized.");

    return database;
  })();

  return initPromise;
}

export async function query(
  sql: string,
  params: (string | number)[] = []
) {
  const database = await initializeDatabase();

  const stmt = database.prepare(sql);
  stmt.bind(params);

  const rows: Record<string, unknown>[] = [];

  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  stmt.free();

  return rows;
}