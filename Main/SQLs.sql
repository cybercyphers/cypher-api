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
const sdb = new Database("./DataBases/signups.db");

const signUpsTable = sdb.exec("CREATE TABLE IF NOT EXISTS signups(id INTEGER PRIMARY KEY AUTOINCREMENT, signup_username TEXT UNIQUE,signup_password TEXT,isAlreadyLoggedIn BOOLEAN DEFAULT false,role TEXT DEFAULT user,Gender TEXT DEFAULT unknown_gender,isBlocked BOOLEAN DEFAULT false, joined_at DATETIME DEFAULT CURRENT_TIMESTAMP)");

const signUpsInsert = sdb.transaction((signup_username,signup_password)=>{
  const smtp = sdb.prepare("INSERT OR IGNORE INTO signups(signup_username,signup_password) VALUES(?,?)");
  return smtp.run(signup_username,signup_password)
})
        
//database ueser check if exists
const dbUserCheck = sdb.prepare("SELECT * FROM signups WHERE signup_username=?")

// toggle login status
const isAlreadyLoggedInToggle = sdb.prepare(" UPDATE signups SET isAlreadyLoggedIn=true WHERE signup_username=?");

//toggle logged in device to false
const isAlreadyLoggedInToggleFalse = sdb.prepare("UPDATE signups SET isAlreadyLoggedIn=false WHERE signup_username=?");

const data = sdb.prepare("SELECT * FROM signups ").all()
console.log(data)
// password username select 
const usernameResetSelect = sdb.prepare("SELECT * FROM signups WHERE signup_username=?");

// password reset update 
const userPasswordReset = sdb.prepare("UPDATE signups SET signup_password=? WHERE signup_username = ?")






















export  default db
export {  
    newInsert,
    sdb,
    signUpsInsert,
    dbUserCheck,
    isAlreadyLoggedInToggle,
    isAlreadyLoggedInToggleFalse,
    usernameResetSelect,
    userPasswordReset
}
    
