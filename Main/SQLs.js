import Database from 'better-sqlite3';
const db = new Database("./DataBases/IDS.db");

db.exec("CREATE TABLE IF NOT EXISTS users(id VARCHAR(10) UNIQUE, username TEXT UNIQUE , online BOOLEAN DEFAULT false,role TEXT DEFAULT user, joined_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

const newInsert = db.transaction((id,username)=>{
  const smtp = db.prepare("INSERT OR IGNORE INTO users(id,username) VALUES(?,?)")
  smtp.run(id,username);
});


setTimeout(()=>{
const d = db.prepare("SELECT * FROM users").all()
console.log(d);
},15
)




export  { 
    db,
    newInsert
}
    
