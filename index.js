// import modules 
import Watch from './watch.js'
import fetch from 'node-fetch'
import express from 'express'; 
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
import morgan from 'morgan';
import Database from 'better-sqlite3';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import session from 'express-session';
import connectSql from 'connect-sqlite3';
import {
    ipRoute,
    apiWorking,
    Ping,
    PreviewImg,
    Email,
    getPort,
    logDir,
    GitHub,
    totalRequests,
    About
       } from './Main/cyphers.js';

const SQLiteStore = connectSql(session)
// module import end

//------------------vh-------------------------


// execute import if any, only packages.
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended : true}));
app.use(express.static(path.join(__dirname,"Front_End")))
app.use(express.static(path.join(__dirname,"Front_End","CSS")));
app.use(morgan("dev"));
app.use(cookieParser());
app.set("trust proxy",1);
app.set("json spaces",2.4)


//Rate limiting too many requests 
  app.use(rateLimit({
      windowMs : 1000 * 60,
      max : 60,
      message : (["Too many request within the range of 1(one) minute. Please try again after a minutes"])
})
  
  )


function fingerprint(req,res,next){

  const raw =
    (req.headers["user-agent"] || "") +
    (req.headers["accept-language"] || "") +
    (req.headers["accept-encoding"] || "") +
    (req.headers["sec-ch-ua"] || "") +
    (req.headers["sec-ch-ua-platform"] || "")
  +(req.headers["sec-ch-ua-mobile"] || "");

  req.fingerprint = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
  next();
}

app.use(fingerprint);


//blocked ips
function liveCheck(){
  const  blockedBrowsers = path.join(__dirname,"./maintainance/config.json");
   const readBlocked = fs.readFileSync(blockedBrowsers,"utf8");
    const readFile = JSON.parse(readBlocked).blockedDevices
    console.log(readFile)
    return readFile;
}


function checkBlocked(req,res,next){
    
   const liveChecked = liveCheck();
    if(liveChecked.includes(req.fingerprint)){
               console.log(`\n\n\x1b[1;36m A user with browserId\x1b[0m \x1b[3;32m${req.fingerprint}\x1b[0m \x1b[1;36mtried accessing cypherApi but has been blocked due to suspicious activities\x1b[0m`)
 return res.status(403).json({ 
     Developer : "cyphers",
     statusCode : 429,
     message : " you have been blocked due to suspicion",
     Option : " please contact support @ cybercyphers2008@gmail.com"
     
    
     
 });
 
 }
   next()
}
//  only packages import execution ends here.
//-------------------------------------------

// other files actions or import actions
app.use(checkBlocked)


app.use(session({
  store : new SQLiteStore({
    db : "session.db",
    dir: "./DataBases"
  }),
  name : "cypher.sid",
  secret : "773879476d5e159873a7a0ccf5779782",
  resave : false,
  saveUninitialized : false,
  cookie :{
    httpOnly:true,
    sameSite : "lax",
      maxAge : 1000 * 60 * 60 * 24 * 30
  }
}))


ipRoute(app)
apiWorking(app)
Ping(app)
PreviewImg(app)
Email(app)
GitHub(app)
totalRequests(app)
About(app)

app.get("/cyphers/browserId",(req,res)=>{
 res.json({ message : req.fingerprint })
})
//other file actions ends here 
function removeLogs(){
   setTimeout(()=>{
      
  for(const dir of logDir()){
     
                 if(fs.existsSync(dir)){
                 
                 fs.rm(dir, 
                             { 
      recursive : true,
      force : true
  },
                            err =>{
  if(err){
     return console.log("\x1b[31mfailed to remove",dir,"directory\x1b[0m"); 
 }
      console.log(`\x1b[1;32mSuccessfully removed ${dir} directory...\x1b[0m`)
}
                           ) }}
 }, 5000);
}

removeLogs()

setInterval(()=>{
 removeLogs()
},6000)


//Port inclusion 



//-------------------------------------------

// Port to listen on
app.listen(`${getPort()}`, ()=>{
  console.log(`\x1b[1;33mWeb started runing  at \x1b[0m, \x1b[33m${new Date().toString()}\x1b[0m and \x1b[33m on port ${getPort()}\x1b[0m`)
})

// EOF
