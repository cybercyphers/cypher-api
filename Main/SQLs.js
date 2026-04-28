import Database from 'better-sqlite3';
const db = new Database("./DataBases/IDS.db");

db.exec("CREATE TABLE IF NOT EXISTS cyphers(name TEXT)");


export { db };
