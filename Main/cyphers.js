import { execFile } from 'child_process'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
import os from 'os';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';


const db = new Database("./DataBases/IDS.db");
//-----â€”-------------------------------------



async function getId(app){
 const ID = crypto.randomBytes(6).toString("hex");
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
         message : "cypher-api is currectly under a big maintainance. please come back after some minutes ðŸ˜Š"
         
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
console.log(err)}
}

//---------------------------â€”â€¢--------------
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
 app.get("/cyphers/",(req,res,next)=>{

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
  let { pingDomain, repeatFor } = req.query;
 if(!pingDomain){
    return sendError(res,400,"Please specify the domain.");
}else if(!repeatFor){
  return sendError(res,400,"please specify the number of times to ping the domain for.eg.                ping=https://example.com&repeatFor=3")
   }
    const domainValidation =/^https?:\/\/|(www\.)?.+/
     const domainValidationResult = domainValidation.test(pingDomain);
     
 if(domainValidationResult){
    const finalDomain = new URL(pingDomain);
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
     rate = "The Domain response time is very fast ðŸ”¥ Execllent";
}else if(pingTime > 100 && pingTime<= 300){
    rate = "The Domain response Time is moderateðŸ¥ˆ";
  } else if(pingTime > 400){
     rate = "The Domain response time is very slow ðŸ™ .If the domain is yours please try upgrading the response time for productivity"
}
         return res.status(200).json({
             Developer : "cyphers",
             success : true,
             status : 200,
             date : date(),
             message : "ping was successfull â˜‘",
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
  app.post("/cyphers/StartEmail",(req,res)=>{
   const { startEmail } = req.body;
  if(!startEmail){
    return sendError(res,400,"Email address not specified");
  }
  return sendSuccess(res,200,"continue")
      console.log(req.body)
})
}



export {
    ipRoute,
    apiWorking,
    Ping,
    PreviewImg,
    Email
};
