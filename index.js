// import modules 
import express from 'express'; 
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(__filename)
import morgan from 'morgan';
import Database from 'better-sqlite3';
import cors from 'cors';
import {
    ipRoute,
    apiWorking,
    Ping,
    PreviewImg,
    Email
       } from './Main/cyphers.js';

// module import ends

//-------------------------------------------

// execute import if any, only packages.
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended : true}));
app.use(express.static(path.join(__dirname,"Front_End")))
app.use(express.static(path.join(__dirname,"Front_End","CSS")));
app.use(morgan("dev"))
app.set("trust proxy",1);
app.set("json spaces",1.4)
const PORT = 53727;

//  only packages import execution ends here.
//-------------------------------------------

// other files actions or import actions



ipRoute(app)
apiWorking(app)
Ping(app)
PreviewImg(app)
Email(app)
//ither file actions ends here
 
//-------------------------------------------

// Port to listen on
app.listen(`${PORT}`, ()=>{
  console.log(`\x1b[1;33mWeb started runing  at \x1b[0m, \x1b[33m${new Date().toString()}\x1b[0m and \x1b[33m on port ${PORT}\x1b[0m`)
})

// EOF
