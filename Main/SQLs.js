import Database from 'better-sqlite3';
const db = new Database("./DataBases/IDS.db");

db.exec("CREATE TABLE IF NOT EXISTS users(id VARCHAR(10) UNIQUE, name TEXT, online BOOLEAN DEFAULT false, joined_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

const newInsert = db.exec("INSERT INTO users(id,name,online) VALUES(?,?,?)");



export  { 
    db,
    newInsert
}
    
