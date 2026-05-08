import { execFile } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
import os from 'os';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import  db,{    
    newInsert,
    sdb,
    signUpsInsert,
    dbUserCheck,
    isAlreadyLoggedInToggle,
    isAlreadyLoggedInToggleFalse,
    usernameResetSelect,
    userPasswordReset
} from './SQL.js';
import crypto from 'crypto';

import { saveErrorLog } from '../index.js';

const ID = crypto.randomBytes(3).toString("hex")
//-----Ã¢â‚¬â€-------------------------------------

db.pragma("journal_mode=WAL");
db.pragma("synchronous=FULL");
sdb.pragma("journal_mode=WAL");
sdb.pragma("synchronous=FULL");
const sdbIntegrityCheck = sdb.pragma("integrity_check",{ simple:true });
const dbIntegrityCheck = db.pragma("integrity_check",{ simple : true });
db.pragma("wal_checkpoint");
sdb.pragma("wal_checkpoint")
function databaseIntegrityCheck(){
  if(sdbIntegrityCheck !== "ok" && dbIntegrityCheck !== "ok" ){
   console.log("\n\x1b[1;31mDatabase might have been corrupted please fix\x1b[0m\n");
 }else{
    console.log("\n\x1b[1;32mDatabase is operational and secure, initializing next code.....\x1b[0m\n")
 }
}
databaseIntegrityCheck()

function logDir(){
 const filePath = path.join(__dirname,"../maintainance","config.json");
    const filePathRead = fs.readFileSync(filePath,"utf8");
    const logdir = JSON.parse(filePathRead).DIRS;
    return logdir;
}

//save info

function saveUserInfo(user,info){
  const dirPath = path.join(os.homedir(),"user_info");
    const userFilePath = path.join(dirPath,user+"_user"+".txt")
 if(!fs.existsSync(dirPath)){
     fs.mkdirSync(dirPath,{ recursive :  true })
 }
   fs.appendFileSync(userFilePath,info+"\n")
}




function getPort(){
  const filePath = path.join(__dirname,"../maintainance","config.json");
    const readFilePath = fs.readFileSync(filePath,"utf8");
    const PORT = JSON.parse(readFilePath).PORT;
    return PORT;
   
}


async function getId(app){
 const ID = crypto.randomBytes(5).toString("hex");
}

// maiantaincr function
function getMaintainanceStatus(){
 const configPath = path.join(__dirname,"../maintainance/config.json");
   const configPathChecked = fs.readFileSync(configPath,"utf8");
    
    const finalCheck = JSON.parse(configPathChecked)
    return finalCheck.isUnderMaintainance;
}

// checking maintainance function
function checkMaintainance(req,res,next){
   const checkAndRespond = getMaintainanceStatus()
  if(checkAndRespond){
     return res.status(503).json({
         Developer : "cyphers",
         status : 503,
         date : `${new Date().toString()}`,
         message : "cypher-api is currectly under a big maintainance. please come back after some minutes Ã°Å¸ËœÅ "
         
})
      return true;
  } 
    return false;
}
// date
function date(){
    const date = new Date().toString();
    return date;
}

// function to send succes if true
const sendSuccess =(res,statusCode,message)=>{
  return res.status(200).json({ 
      Developer : "cyphers",
      success : true,
      Date : date(),
      statusCode : `${statusCode}`,
      message : `${message}`
  })
}

// function to send error if false 
function sendError(res,statusCode,message){
 return res.status(statusCode).json({
     Developer : "cyphers",
     success : false,
     Date : date(),
     statusCode : `${statusCode}`,
     message :`${message}`
})
}




//--------------------------â€¢â€¢--------------
// preview image

const PreviewImg =(app)=>{
 app.get("/cyphers/cypher_prev",(req,res)=>{
  return res.status(200).sendFile(path.join(__dirname,"../Front_End","cypher_prev.png"))
  })
}

// ip route
const ipRoute =(app) =>{ 
    
    app.get("/cyphers/ip",(req,res,next)=>{
  try{
     if(checkMaintainance(req,res,next))return;
 const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

 return res.status(200).send({ip})
      }catch(err){
    console.log(err.stack)
  }
})
                    }


// api working route
//-------------------------------------------
const apiWorking = (app)=>{
 app.get("/cyphers/home_page",(req,res,next)=>{
if(!req.session.user){
   return res.status(403).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>âš ï¸ 403 Unauthenticated</title>

  <style>
    *{
      box-sizing:border-box;
      margin:0;
      padding:0;
      font-family: Arial, sans-serif;
    }

    body{
      min-height:100vh;
      display:flex;
      justify-content:center;
      align-items:center;
      background: linear-gradient(120deg, #000000, #0b0f14, #000000);
      color:white;
      flex-direction : column;
margin:0;
background-color:black;
overscroll-behaviour-x : contain;
    }

    .card{
      height:auto;
      width:100%;
      max-width:800px;
      padding:50px 40px;
      text-align:center;
      border-radius:25px;
       background:rgba(255,255,255,0.08);
      backdrop-filter:blur(15px);
      box-shadow:0 10px 30px rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.15);
      margin: 100px;
    }

    .code{
      font-size:90px;
      font-weight:900;
      color:#f87171;
      margin-bottom:10px;
      text-shadow:0 0 20px rgba(248,113,113,.4);
    }

    h1{
      margin-bottom:12px;
      font-size:35px;
      color : red;
    }

    p{
      color:#cbd5e1;
      line-height:1.6;
      margin-bottom:30px;
      font-size:15px;
    }

    .btn{
      display:inline-block;
      text-decoration:none;
      padding:14px 28px;
      border-radius:15px;
      background:#22c55e;
      color:white;
      font-weight:700;
      transition:.25s;
    }

    .btn:hover{
      transform:translateY(-2px);
      box-shadow:0 8px 20px rgba(34,197,94,.35);
    }
main{
 flex:1;
display:flex;
justify-content:center;
align-items:center;
}

   
  </style>
</head>
<body>
<main>
  <div class="card">
 
    <div class="code">403</div>
    <h1>Unauthenticated</h1>
    <p>
      You session has expired.please login to be verified
    </p>

    <a href="/cyphers/login" class="btn">Go to Login</a>
  </div>
</main><br/><br/>
<footer style="display:flex; justify-content:center; align-items:center; width:100%; bottom:0;border-top: solid 0.7px burlywood;">
<h6 style="margin:10px;">&copy; 2026 Cyber Cyphers. All rights reserved</h6>
</footer>
</body>
</html>`)
}
     
return res.status(200).sendFile(path.join(__dirname ,"../Front_End","home_page","index.html"))


  }
 
)
         }



//ping route
//------------/------------/-------------/---
const Ping = (app)=>{
    try{
        
 app.get("/cyphers/ping",( req,res,next)=>{
      if(checkMaintainance(req,res,next)) return;
  let { domain, repeatFor } = req.query;
 if(!domain){
    return sendError(res,400,"Please specify the domain.");
}else if(!repeatFor){
  return sendError(res,400,"please specify the number of times to ping the domain for.eg.                ping=https://example.com?domain=https://example.com&repeatFor=3")
   }
    const domainValidation =/^https?:\/\/|(www\.)?.+/
     const domainValidationResult = domainValidation.test(domain);
     
 if(domainValidationResult){
    const finalDomain = new URL(domain);
     const finalDomainHostname = finalDomain.hostname;
     const PING = execFile("ping", ["-c",`${repeatFor}`,finalDomainHostname],(err,stdout)=>{
    if(err){
        console.log(err)
      return sendError(res,err.statusCode,"Oops an error occured, please try again later. We are reviewing the error and what caused it")
}
         const pingTimeValidation = stdout.match(/time=([\d.]+)\s*ms/);
      const pingTime =  pingTimeValidation[1] || null;
         let rate;
    if(pingTime < 100){
     rate = "The Domain response time is very fast Ã°Å¸â€Â¥ Execllent";
}else if(pingTime > 100 && pingTime<= 300){
    rate = "The Domain response Time is moderateË†";
  } else if(pingTime > 400){
     rate = "The Domain response time is very slow.If the domain is yours please try upgrading the response time for productivity"
}
         return res.status(200).json({
             Developer : "cyphers",
             success : true,
             status : 200,
             date : date(),
             message : "ping was successfull Ã¢Ëœâ€˜",
             response : pingTime+"ms",
             rate : rate
    })
  })
 }
})
    }catch(err){
      console.log(err)
}
}




//email part startup 

const Email =(app)=>{
    try{
  
    }catch(err){
 console.log(err)
     }
}

//github info and download
const GitHub=(app)=>{
    try{
  
  app.get("/cyphers/github",async(req,res)=>{
  let { url, type } = req.query;
 if(!url){
   return sendError(res,400,"'url' not specified, please specify the url.eg. https://panel-cyphers.nett.to/cyphers/github?url=https://github.com/username/name.git&type=json");
 }
const githubRepoValidation = /^https:\/\/github\.com\/.+\/.+(?:\.git)?$/
    if(!githubRepoValidation.test(url)){
      return sendError(res,400,"The url provided is not a valid url please check and try again");
    }
    const newGitHubUrlStructuring = new URL(url);
    const hostname = newGitHubUrlStructuring.hostname;
    const pathName = newGitHubUrlStructuring.pathname;
    

  if(!type){
    return sendError(res,400,"please specify how you would want to receive the data.eg.https://pane........com&type=json");
  }
  if(type ==='json'){
      const finalPath = pathName.replace(".git","")
     const finalUrl =`https://api.github.com/repos${finalPath}`
 const ask = await fetch(finalUrl,{ method :"GET", headers : {
     "Content-Type" : "application/json"
 }})
  
      const rq = await ask.json();
      const final = JSON.stringify(rq)
   return sendSuccess(res,200,[final])
  }
      return sendError(res,200,"Oops an error occured, please try again later.")
  })
    }catch(err){console.log(err.stack)}
}





// request count 
let totalReqs = 650;
const totalRequests=(app)=>{  
app.use((req,res,next)=>{
  if(req.path !== "/cyphers/totalRequests"){
  totalReqs++
     
  }
    next()
})
    app.get("/cyphers/totalRequests",(req,res,next)=>{
    res.json({ totalReqs })
  })
}


const About = (app)=>{
   app.get("/cyphers/about",(req,res)=>{
       try{
     res.status(200).sendFile(path.join(__dirname,"../Front_End","home_page","about.html"))
       }catch(err){
         res.status(500).send("Oop an error occured")
       }
}
   )
}

//signup route
const signUpPOST =(app)=>{
   
    app.post("/cyphers/sign_up",async(req,res)=>{
        try{
 const { username, password } = req.body || {};
    if(!username){
     return sendError(res,400,"Please give a unique username");
 };
        if(!password){
      return sendError(res,400,"please enter a password to continue");
};
            if(password.length <= 5 || password.length > 15){
     return  sendError(res,400,"Password should be at least six characters ")
}
        const hashedPass = await bcrypt.hash(password,10)
   const result =  signUpsInsert(username,hashedPass);
            
            
          if(!result || result.changes <= 0){
        return sendError(res,409,"user already exists")
}
   
        sendSuccess(res,200,"signup was successfull");
            console.log(`\x1b[36mA new user signed Up. Identifier ${username} at ${new Date().toISOString()}`)
           
    }catch(err){
       console.log(err)
       
     }
   })
};




//signup route
const signUpGET = (app)=>{
  app.get("/cyphers/sign_up",(req,res)=>{
    if(!req.session.user){
      return res.status(200).sendFile(path.join(__dirname,"../Front_End","home_page","signup.html")
)
    }
      return res.redirect("/cyphers/home_page")
    }
           )
}
    

const logInPOST = (app)=>{
  app.post("/cyphers/login",async(req,res)=>{
      try{
    let { username, password } = req.body;
      if(!username || !password){
   return sendError(res,400,"All fields required");
 }
      
      const userCheck = dbUserCheck.get(username);
      if(!userCheck){
          return sendError(res,404,"user not found")
      }
          
     const userPassCheck = userCheck.signup_password;
     
   
    
    
    
     const passwordCompare = await bcrypt.compare(password,userPassCheck);
          if(!passwordCompare){
          return sendError(res,400,"wrong password, please try again ")
              
       }   
          // check wheather already logged in on other device and set status
          
      const isAlreadyLoggedInCheck = userCheck.isAlreadyLoggedIn;
          if(isAlreadyLoggedInCheck===true || isAlreadyLoggedInCheck === 1){
    return sendError(res,res.statusCode,"Please logout from other device to be able to login here")
}
          
         isAlreadyLoggedInToggle.run(username);
          
          req.session.user=username;
          const finalInfo = `${username} logged in at ${new Date().toISOString()}, saving session....`;
       //save info for each user
          saveUserInfo(req.session.user,finalInfo)
   return  sendSuccess(res,200,"Login successful");
       
               
     }catch(err){
       return res.send("An Error Occured")
         saveErrorLog(err)
        
     };
 });
};

const logInGET = (app,brutePrevent)=>{
  app.get( "/cyphers/login",(req,res)=>{
return res.status(200).sendFile(path.join(__dirname,"../Front_End","home_page","login.html"))
  });
};

const logOut = (app)=>{
    
  app.get("/cyphers/logout",(req,res)=>{
      try{  
        isAlreadyLoggedInToggleFalse.run(req.session.user);
          //save info the user_file 
   const finalInfo = `${req.session.user}, logged Out at ${new Date().toISOString()}\n`; 
          saveUserInfo(req.session.user,finalInfo)
     console.log(`\x1b[1;36m${req.session.user} logged Out at ${new Date().toISOString()} \x1b[0m`)
      req.session.destroy(()=>{
          res.clearCookie("cypher.sid")
   return res.redirect("/cyphers/login")
})
  
    }catch(err){
        saveErrorLog(req,err)
      return res.status(500).send("An internal Error occured");
 }
  })
}

const User = (app)=>{
  app.get("/cyphers/userId",(req,res)=>{
    return res.status(200).send(req.session.user)
 })
}

//password reset route

const resetPassword = (app)=>{
  app.patch("/cyphers/reset_password",async(req,res)=>{
      try{
    let { username, oldPassword, newPassword } = req.body;
if(!req.session.user){
  return sendError(res,401,`Oops, we could not verify ${ req.ip || "you" } as the rightful owner to this account, please try again later`)
}
    if(!username || !oldPassword || !newPassword){
      return sendError(res,400,"all fields required");
    }
    const getUser = usernameResetSelect.get(username)
    if(!getUser){
   return sendError(res,404,"wrong username or username not found")
}
      const userOldPassword = getUser.signup_password;
      const oldPasswordComparation = await bcrypt.compare(oldPassword, userOldPassword);
     if(!oldPasswordComparation){
   return sendError(res,400,"old password is wrong, please retry")
}
      const hashNewPassword = await bcrypt.hash(newPassword,10);
      
      const newPasswordUpdate = userPasswordReset.run(hashNewPassword,username)
      const finalInfo = `A User Updated a password, identifier ${username} at ${new Date().toISOString()}\n`;

 saveUserInfo(username,finalInfo)
      
      return sendSuccess(res,200,"password reset successfully");  
      }catch(err){
     return res.status(500).send("Oops an error occured please try afain later")
          saveErrorLog(err)
}
  });
  
};



export {
    ipRoute,
    apiWorking,
    Ping,
    PreviewImg,
    Email,
    getPort,
    logDir,
    GitHub,
    totalRequests,
    About,
    signUpPOST,
    signUpGET,
    logOut,
    date,
    logInPOST,
    logInGET,
    User,
    resetPassword
          
};
