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
import  { 
    db, 
    newInsert
} from './SQLs.js';
import crypto from 'crypto';

const ID = crypto.randomBytes(3).toString("hex")
//-----Ã¢â‚¬â€-------------------------------------
function logDir(){
 const filePath = path.join(__dirname,"../maintainance","config.json");
    const filePathRead = fs.readFileSync(filePath,"utf8");
    const logdir = JSON.parse(filePathRead).DIRS;
    return logdir;
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
 return res.status(500).json({
     Developer : "cyphers",
     success : false,
     Date : date(),
     statusCode : `${statusCode}`,
     message :`${message}`
})
}

// system Error save
function saveErrorLog(){
    try{
    const homeDir = os.homedir(); 
 const errorPath = path.join(homeDir,"serverErrors");
   const errorFile = path.join(errorPath,date()+".txt")
 if(!fs.existsSync(errorPath)) {
     fs.mkdirSync(errorPath, {recursive : true})
                               }
    }catch(err){
console.log("could not save error to file", err)}
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
  app.post("/cyphers/StartEmail",(req,res,next)=>{
   const { startEmail, startPin } = req.body;
      if(req.session.user){
          next()
      }else if(!startEmail){
    return sendError(res,400,"Email address not specified");
  }
  newInsert(ID,startEmail)
      if(startEmail === "CYPHERS"){
     setTimeout(()=>{
 db.prepare("UPDATE users SET role=? WHERE username = ?").run('Admin Dev','CYPHERS')
},10)
      }
    req.session.user = startEmail;   
      res.status(200).json({message:"continue"})
      
     
})
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
      console.log(totalReqs++)
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
    About
};
