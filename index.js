// import modules.
import { exec } from 'child_process'
import db from './Main/SQL.js';
import Watch from './watch.js'
import fetch from 'node-fetch'
import express from 'express'; 
import fs from 'fs';
import { fileURLToPath } from 'url'; 
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
import Database from 'better-sqlite3';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import session from 'express-session';
import connectSql from 'connect-sqlite3';
import os from 'os';
import compression from 'compression';
import hpp from 'hpp';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import ExpressBrute from 'express-brute';

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
    About,
    signUpPOST,
    signUpGET,
    logOut,
    date,
    logInPOST,
    logInGET,
    User,
    resetPassword
       } from './Main/cyphers.js';

const SQLiteStore = connectSql(session)
// module import end

/*exec("npm update connect-sqlite3 npm audit",(err,stdout,stderr)=>{
  if(err){
   console.log(err)
} 
    if(stdout){
 console.log(stderr)
    }
   
    console.log(stdout)
})*/

//------------------v----------------------


// execute import if any, only packages.

const app = express();
app.use(cors({
origin : ["https://panel-cyphers.nett.to/cyphers"],
    credentials : true
}))
app.use(express.json());
app.use(express.urlencoded({ extended : true}));
app.use(express.static(path.join(__dirname,"Front_End")))
app.use(express.static(path.join(__dirname,"Front_End","CSS")));
app.use(cookieParser());
app.set("trust proxy",10);
app.set("json spaces",2.4);
app.use(compression())
app.use(hpp())
app.use(mongoSanitize())
app.use(xssClean())




const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5000,
  maxWait: 60000,
  lifetime: 60
});
const brutePrevent = bruteforce.prevent;



//Database Protection from SQL INJECTION 

function waf(config = {}) {
  // Track normal users vs attackers
  const requestHistory = new Map();
  const blockedIPs = new Set();
  const suspiciousIPs = new Map();

  // Clean old entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestHistory) {
      if (now - data.lastRequest > 600000) {
        requestHistory.delete(ip);
      }
    }
    for (const [ip, time] of suspiciousIPs) {
      if (now - time > 3600000) {
        suspiciousIPs.delete(ip);
      }
    }
  }, 600000);

  return (req, res, next) => {
    const clientIP = req.ip;
    const now = Date.now();

    // Initialize IP tracking
    if (!requestHistory.has(clientIP)) {
      requestHistory.set(clientIP, {
        requests: [],
        totalRequests: 0,
        blockedRequests: 0,
        lastRequest: now,
        firstSeen: now
      });
    }

    const ipData = requestHistory.get(clientIP);
    ipData.lastRequest = now;
    ipData.totalRequests++;

    // Clean old requests (older than 1 minute)
    ipData.requests = ipData.requests.filter(time => now - time < 60000);
    ipData.requests.push(now);

    // ================= NORMAL USER PROTECTION =================
    // Identify normal behavior patterns
    const isNormalUser = (
      ipData.totalRequests > 20 && // Has history
      ipData.blockedRequests < 3 && // Not been blocked much
      ipData.requests.length < 30 // Normal request rate
    );

    // Trust established normal users more
    if (isNormalUser && !suspiciousIPs.has(clientIP)) {
      // Quick check only for obvious attacks
      if (isObviousAttack(req)) {
        ipData.blockedRequests++;
        return blockAttack(req, res, 'Obvious attack from normal user');
      }
      return next();
    }

    // ================= NEW USER / SUSPICIOUS =================

    // Get request data for analysis
    const requestData = {
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      params: JSON.stringify(req.params || {}),
      headers: JSON.stringify(req.headers || {}),
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type'] || '',
      userAgent: req.headers['user-agent'] || ''
    };

    const fullRequestString = 
      requestData.body + 
      requestData.query + 
      requestData.params + 
      requestData.url;

    // ================= COMPREHENSIVE ATTACK DETECTION =================

    // 1. SQL INJECTION DETECTION
    if (config.sqlInjection !== false) {
      const sqlPatterns = [
        // Core SQL injection
        /(\bUNION\b\s+\bALL\b\s+\bSELECT\b)/i,
        /(\bUNION\b\s+\bSELECT\b)/i,
        /(' \s*OR\s+'1'\s*=\s*'1)/i,
        /(" \s*OR\s+"1"\s*=\s*"1)/i,
        /(' \s*OR\s+1\s*=\s*1)/i,
        /(' \s*OR\s+'a'\s*=\s*'a)/i,
        /(\bOR\b\s+\d+\s*=\s*\d+)/i,
        /(\bAND\b\s+\d+\s*=\s*\d+)/i,
        
        // Database manipulation
        /(\bDROP\b\s+\bTABLE\b)/i,
        /(\bDROP\b\s+\bDATABASE\b)/i,
        /(\bTRUNCATE\b\s+\bTABLE\b)/i,
        /(\bALTER\b\s+\bTABLE\b)/i,
        /(\bCREATE\b\s+\bTABLE\b)/i,
        /(\bINSERT\b\s+\bINTO\b)/i,
        /(\bDELETE\b\s+\bFROM\b)/i,
        /(\bUPDATE\b\s+\w+\s+\bSET\b)/i,
        /(\bEXEC\b\s*\()/i,
        /(\bEXECUTE\b\s*\()/i,
        
        // Database enumeration
        /(\bINFORMATION_SCHEMA\b)/i,
        /(\bsqlite_master\b)/i,
        /(\bsys\.tables\b)/i,
        /(\bpg_catalog\b)/i,
        /(\bmysql\.user\b)/i,
        /(\bFROM\b\s+\bpg_shadow\b)/i,
        /(\bFROM\b\s+\bmysql\.user\b)/i,
        
        // SQL functions
        /(\bsleep\b\s*\()/i,
        /(\bbenchmark\b\s*\()/i,
        /(\bpg_sleep\b\s*\()/i,
        /(\bWAITFOR\b\s+\bDELAY\b)/i,
        /(\bLOAD_FILE\b\s*\()/i,
        /(\bINTO\b\s+\bOUTFILE\b)/i,
        /(\bINTO\b\s+\bDUMPFILE\b)/i,
        /(\bgroup_concat\b\s*\()/i,
        /(\bstring_agg\b\s*\()/i,
        /(\bLISTAGG\b\s*\()/i,
        /(\bextractvalue\b\s*\()/i,
        /(\bupdatexml\b\s*\()/i,
        /(\bCONCAT\b\s*\()/i,
        /(\bCHAR\b\s*\()/i,
        /(\bASCII\b\s*\()/i,
        /(\bSUBSTR\b\s*\()/i,
        /(\bSUBSTRING\b\s*\()/i,
        /(\bMID\b\s*\()/i,
        /(\bLENGTH\b\s*\()/i,
        /(\bCOUNT\b\s*\()/i,
        /(\bCAST\b\s*\()/i,
        /(\bCONVERT\b\s*\()/i,
        /(\bSELECT\b\s+\*\s+\bFROM\b)/i,
        
        // Comments and terminators
        /(';\s*--)/i,
        /(";\s*--)/i,
        /(';\s*#)/i,
        /(";\s*#)/i,
        /(\/\*!.*\*\/)/i,
        /(\/\*\d+.*\*\/)/i,
        
        // Encoded attacks
        /(%27\s*OR\s*%271%27\s*=\s*%271)/i,
        /(%22\s*OR\s*%221%22\s*=\s*%221)/i,
        /(%27)|(%23)|(%3B)|(%2D){2}/i,
        
        // Hex encoding
        /(0x[0-9a-fA-F]{2,})/i,
        
        // Stacked queries
        /(;\s*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
        
        // Oracle specific
        /(\bUTL_INADDR\b)/i,
        /(\bDBMS_PIPE\b)/i,
        /(\bOWA_UTIL\b)/i,

        // Blind SQL injection
        /(\bAND\b\s+\bSLEEP\b)/i,
        /(\bOR\b\s+\bSLEEP\b)/i,
        /(\bAND\b\s+\d+\s*=\s*\d+\s*\bSLEEP\b)/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'SQL Injection', pattern, ipData);
        }
      }
    }

    // 2. XSS DETECTION
    if (config.xss !== false) {
      const xssPatterns = [
        // Script tags
        /<\s*script[\s>]/i,
        /<\/\s*script\s*>/i,
        /<\s*script\s*>/i,
        
        // Event handlers
        /\bon\w+\s*=\s*["'][^"']*["']/i,
        /\bon\w+\s*=\s*\w+/i,
        /\bonerror\b/i,
        /\bonload\b/i,
        /\bonclick\b/i,
        /\bonmouseover\b/i,
        /\bonfocus\b/i,
        /\bonblur\b/i,
        /\bonchange\b/i,
        /\bonsubmit\b/i,
        /\bonkey\w+\b/i,
        
        // JavaScript URIs
        /\bjavascript\s*:/i,
        /\bvbscript\s*:/i,
        
        // HTML elements
        /<\s*iframe[\s>]/i,
        /<\s*embed[\s>]/i,
        /<\s*object[\s>]/i,
        /<\s*frame[\s>]/i,
        /<\s*applet[\s>]/i,
        /<\s*meta[\s>]/i,
        /<\s*link[\s>]/i,
        /<\s*style[\s>]/i,
        /<\s*svg[\s>]/i,
        /<\s*math[\s>]/i,
        /<\s*img[\s>]/i,
        /<\s*body[\s>]/i,
        /<\s*form[\s>]/i,
        /<\s*input[\s>]/i,
        /<\s*textarea[\s>]/i,
        /<\s*select[\s>]/i,
        /<\s*option[\s>]/i,
        
        // JavaScript functions
        /\beval\s*\(/i,
        /\bexpression\s*\(/i,
        /\bdocument\.cookie\b/i,
        /\bdocument\.location\b/i,
        /\bwindow\.location\b/i,
        /\balert\s*\(/i,
        /\bprompt\s*\(/i,
        /\bconfirm\s*\(/i,
        /\bfetch\s*\(/i,
        /\bXMLHttpRequest\b/i,
        /\bfromCharCode\b/i,
        /\binnerHTML\b/i,
        /\bouterHTML\b/i,
        /\binsertAdjacentHTML\b/i,
        /\bdocument\.write\b/i,
        /\bdocument\.writeln\b/i,
        
        // CSS injection
        /\bexpression\b/i,
        /\bbehavior\s*:/i,
        /-moz-binding/i,
        /@import/i,
        
        // Data URIs
        /\bdata\s*:\s*text\/html/i,
        /\bdata\s*:\s*application\/x-javascript/i,
        
        // Encoded
        /%3C/i,
        /%3E/i,
        /&lt;/i,
        /&gt;/i,
        /&#x3C;/i,
        /&#60;/i,
        /&#x3E;/i,
        /&#62;/i,
        /\\x3C/i,
        /\\x3E/i,
        /\\u003C/i,
        /\\u003E/i,
        
        // Template injection
        /\{\{.*\}\}/i,
        /\{\%.*\%\}/i,
        /\$\{.*\}/i,
        /\#\{.*\}/i,
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'XSS', pattern, ipData);
        }
      }
    }

    // 3. COMMAND INJECTION
    if (config.commandInjection !== false) {
      const cmdPatterns = [
        // Command separators
        /;\s*\b(cat|ls|rm|wget|curl|nc|bash|sh|python|perl|php|ruby|node)\b/i,
        /\|\s*\b(cat|ls|rm|wget|curl|nc)\b/i,
        /`[^`]{3,}`/,
        /\$\([^)]+\)/,
        /&&\s*\b(cat|ls|rm|wget|curl|nc|ping)\b/i,
        /\|\|\s*\b(cat|ls|rm)\b/i,
        /%(.){2}/,
        
        // File operations
        /\bcat\s+\/etc\//i,
        /\bcat\s+\/proc\//i,
        /\breadfile\s*\(/i,
        /\bfile_get_contents\s*\(/i,
        /\bfopen\s*\(/i,
        /\bfread\s*\(/i,
        /\bfwrite\s*\(/i,
        /\bfputs\s*\(/i,
        /\bunlink\s*\(/i,
        /\brm\s+-rf\b/i,
        /\brm\s+-r\b/i,
        /\brmdir\b/i,
        /\bmkdir\b/i,
        /\bchmod\b/i,
        /\bchown\b/i,
        
        // Network commands
        /\bwget\s+http/i,
        /\bcurl\s+http/i,
        /\bnc\s+-[eln]/i,
        /\bnc\s+\d+\.\d+\.\d+\.\d+/i,
        /\bping\s+-c/i,
        /\btraceroute\b/i,
        /\bnslookup\b/i,
        /\bdig\b\s+/i,
        /\bhost\b\s+/i,
        /\btelnet\b/i,
        /\bssh\b/i,
        /\bscp\b/i,
        /\bsftp\b/i,
        /\bftp\b/i,
        
        // System commands
        /\bwhoami\b/i,
        /\buname\b/i,
        /\bifconfig\b/i,
        /\bipconfig\b/i,
        /\bnetstat\b/i,
        /\bps\s+aux\b/i,
        /\bps\s+-ef\b/i,
        /\bkill\b/i,
        /\bkillall\b/i,
        /\bid\b/i,
        /\bdir\b/i,
        /\bpwd\b/i,
        /\bprintenv\b/i,
        /\benv\b/i,
        /\bset\b/i,
        /\bexport\b/i,
        /\bsource\b/i,
        /\bsudo\b/i,
        /\bsu\b/i,
        /\bpasswd\b/i,
        
        // Windows specific
        /\bcmd\.exe\b/i,
        /\bpowershell\b/i,
        /\bpowershell\.exe\b/i,
        /\bnet\s+user\b/i,
        /\bnet\s+localgroup\b/i,
        /\bnet\s+use\b/i,
        /\bnet\s+view\b/i,
        /\bnet\s+share\b/i,
        /\btasklist\b/i,
        /\btaskkill\b/i,
        /\breg\s+add\b/i,
        /\breg\s+delete\b/i,
        /\breg\s+query\b/i,
        /\bsc\s+start\b/i,
        /\bsc\s+stop\b/i,
        /\bsc\s+config\b/i,
        
        // Process execution
        /\bexec\s*\(/i,
        /\bshell_exec\s*\(/i,
        /\bsystem\s*\(/i,
        /\bpassthru\s*\(/i,
        /\bpopen\s*\(/i,
        /\bproc_open\s*\(/i,
        /\bpowershell\s+-/i,
        /\bStart-Process\b/i,
        /\bInvoke-Command\b/i,
        /\bInvoke-Expression\b/i,
        
        // Reverse shells
        /\breverse\s+shell\b/i,
        /\bbackdoor\b/i,
        /\bbind\s+shell\b/i,
        /\bweb\s+shell\b/i,
        /\/bin\/bash\b/i,
        /\/bin\/sh\b/i,
        /\/bin\/zsh\b/i,
        /\/usr\/bin\/python/i,
        /\/usr\/bin\/perl/i,
        /\/usr\/bin\/php/i,
        /\/usr\/bin\/ruby/i,
      ];

      for (const pattern of cmdPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'Command Injection', pattern, ipData);
        }
      }
    }

    // 4. PATH TRAVERSAL
    if (config.pathTraversal !== false) {
      const pathPatterns = [
        /\.\.\//,
        /\.\.\\/,
        /\.\./,
        /\/etc\/passwd/i,
        /\/etc\/shadow/i,
        /\/etc\/hosts/i,
        /\/etc\/apache/i,
        /\/etc\/nginx/i,
        /\/etc\/mysql/i,
        /\/proc\/self/i,
        /\/proc\/\d+\//i,
        /\/windows\/system32/i,
        /\/windows\/win\.ini/i,
        /C:\\Windows\\System32/i,
        /%2e%2e%2f/i,
        /%2e%2e\//i,
        /\.\.%2f/i,
        /\.\.%5c/i,
        /%252e%252e%252f/i,
        /%c0%ae%c0%ae/i,
        /%uff0e%uff0e/i,
        /\.%00\//,
        /\.%00\\/,
      ];

      for (const pattern of pathPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'Path Traversal', pattern, ipData);
        }
      }
    }

    // 5. NoSQL INJECTION
    if (config.nosqlInjection !== false) {
      const nosqlPatterns = [
        /\$\s*gt\s*:/i,
        /\$\s*lt\s*:/i,
        /\$\s*gte\s*:/i,
        /\$\s*lte\s*:/i,
        /\$\s*ne\s*:/i,
        /\$\s*eq\s*:/i,
        /\$\s*in\s*:/i,
        /\$\s*nin\s*:/i,
        /\$\s*regex\s*:/i,
        /\$\s*where\s*:/i,
        /\$\s*or\s*:/i,
        /\$\s*and\s*:/i,
        /\$\s*not\s*:/i,
        /\$\s*nor\s*:/i,
        /\$\s*exists\s*:/i,
        /\$\s*type\s*:/i,
        /\$\s*mod\s*:/i,
        /\$\s*regex\s*:/i,
        /\$\s*options\s*:/i,
        /\$\s*elemMatch\s*:/i,
        /\$\s*size\s*:/i,
        /\$\s*all\s*:/i,
        /\$\s*slice\s*:/i,
        /\$\s*inc\s*:/i,
        /\$\s*set\s*:/i,
        /\$\s*unset\s*:/i,
        /\$\s*push\s*:/i,
        /\$\s*pull\s*:/i,
        /\{\s*"\$where"\s*:\s*"/i,
        /\{\s*"\$regex"\s*:\s*"/i,
        /__proto__/i,
        /constructor\s*:/i,
        /prototype\s*:/i,
      ];

      for (const pattern of nosqlPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'NoSQL Injection', pattern, ipData);
        }
      }
    }

    // 6. PROTOTYPE POLLUTION
    if (config.prototypePollution !== false) {
      const protoPatterns = [
        /__proto__/i,
        /\.__proto__/i,
        /constructor\.prototype/i,
        /\[\s*["']__proto__["']\s*\]/i,
        /\[\s*["']constructor["']\s*\]\s*\[\s*["']prototype["']\s*\]/i,
        /\bhasOwnProperty\b.*__proto__/i,
      ];

      for (const pattern of protoPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'Prototype Pollution', pattern, ipData);
        }
      }
    }

    // 7. SSRF (Server-Side Request Forgery)
    if (config.ssrf !== false) {
      const ssrfPatterns = [
        /http:\/\/127\.0\.0\.1/i,
        /http:\/\/localhost/i,
        /http:\/\/0\.0\.0\.0/i,
        /http:\/\/169\.254\.\d+\.\d+/i,
        /http:\/\/10\.\d+\.\d+\.\d+/i,
        /http:\/\/172\.(1[6-9]|2\d|3[01])\./i,
        /http:\/\/192\.168\.\d+\.\d+/i,
        /file:\/\//i,
        /gopher:\/\//i,
        /dict:\/\//i,
        /ftp:\/\//i,
        /ldap:\/\//i,
        /tftp:\/\//i,
        /\.metadata\//i,
        /\/\.env$/i,
        /\/\.git\//i,
        /\/\.svn\//i,
        /\/\.htaccess/i,
      ];

      for (const pattern of ssrfPatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'SSRF', pattern, ipData);
        }
      }
    }

    // 8. XML External Entity (XXE)
    if (config.xxe !== false) {
      const xxePatterns = [
        /<!ENTITY\s+/i,
        /<!DOCTYPE\s+/i,
        /SYSTEM\s+["']/i,
        /PUBLIC\s+["']/i,
        /<\?xml/i,
      ];

      for (const pattern of xxePatterns) {
        if (pattern.test(fullRequestString)) {
          return handleAttack(req, res, 'XXE', pattern, ipData);
        }
      }
    }

    // ================= RATE LIMITING FOR ATTACKERS =================
    
    // Too many requests in short time
    if (ipData.requests.length > 100) {
      return handleAttack(req, res, 'Rate Limiting', /RATE_LIMIT/, ipData);
    }

    // Suspicious request patterns
    const suspiciousScore = calculateSuspiciousScore(req, ipData);
    if (suspiciousScore > 8) {
      suspiciousIPs.set(clientIP, now);
      return handleAttack(req, res, 'Suspicious Behavior', /SUSPICIOUS/, ipData);
    }

    // ================= AUTO SANITIZE NORMAL REQUESTS =================
    if (config.autoSanitize !== false) {
      // Light sanitization for normal traffic - won't break functionality
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObjectLight(req.body);
      }
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObjectLight(req.query);
      }
    }

    // ALL CLEAR - Normal traffic passes through
    next();
  };

  // ================= HELPER FUNCTIONS =================

  function isObviousAttack(req) {
    const str = JSON.stringify(req.body || '') + JSON.stringify(req.query || '');
    return /<script|<iframe|javascript:|onerror=|onload=|\bDROP\s+TABLE\b|\bUNION\s+SELECT\b/i.test(str);
  }

  function calculateSuspiciousScore(req, ipData) {
    let score = 0;
    
    // New IP making many requests
    if (ipData.totalRequests < 5 && ipData.requests.length > 10) score += 3;
    
    // Many requests to same endpoint
    const urlCounts = {};
    ipData.requests.forEach(() => {
      urlCounts[req.url] = (urlCounts[req.url] || 0) + 1;
    });
    if (urlCounts[req.url] > 20) score += 2;
    
    // Suspicious user agents
    const ua = req.headers['user-agent'] || '';
    if (ua.includes('sqlmap') || ua.includes('nikto') || ua.includes('nmap') || 
        ua.includes('burp') || ua.includes('w3af') || ua.includes('acunetix')) {
      score += 5;
    }
    
    // Missing common headers
    if (!req.headers['accept-language']) score += 1;
    if (!req.headers['accept']) score += 1;
    
    // Unusual content types
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart') && req.method === 'GET') score += 3;
    
    // Request size anomaly
    const bodyStr = JSON.stringify(req.body || '');
    if (bodyStr.length > 10000) score += 2;
    if (bodyStr.length > 50000) score += 4;
    
    return score;
  }

  function sanitizeObjectLight(obj) {
    if (typeof obj === 'string') {
      return obj
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/`/g, '') // Remove backticks
        .substring(0, 1000); // Limit string length
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip dangerous keys but keep normal ones
        if (key.includes('$') || key === '__proto__' || 
            key === 'constructor' || key === 'prototype') {
          continue;
        }
        cleaned[key] = sanitizeObjectLight(value);
      }
      return cleaned;
    }
    
    return obj;
  }

  function handleAttack(req, res, attackType, pattern, ipData) {
    ipData.blockedRequests++;
    
    // Log the attack
  
console.log(`
\x1b[1;31mâ•­â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•®
â”‚     â›” ATTACK BLOCKED FROM DATABASE â›”                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Attack  : \x1b[33m${attackType.padEnd(42)}\x1b[31mâ”‚
â”‚ IP      : \x1b[36m${(req.ip || "Unknown").padEnd(42)}\x1b[31mâ”‚
â”‚ Path    : \x1b[32m${(req.path || "/").padEnd(42)}\x1b[31mâ”‚
â”‚ Method  : \x1b[35m${(req.method || "Unknown").padEnd(42)}\x1b[31mâ”‚
â”‚ Pattern : \x1b[33m${pattern.toString().slice(0,42).padEnd(42)}\x1b[31mâ”‚
â”‚ Time    : \x1b[37m${new Date().toISOString().padEnd(42)}\x1b[31mâ”‚
â”‚ User    : \x1b[34m${String(req.user?.id || "Guest").padEnd(42)}\x1b[31mâ”‚
â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â•¯
\x1b[0m
`);
      
      
    // If too many blocked requests, add to suspicious
    if (ipData.blockedRequests >= 3) {
      suspiciousIPs.set(req.ip, Date.now());
    }

    // IMMEDIATELY CLEAR ALL DATA TO PREVENT DB ACCESS
    req.body = {};
    req.query = {};
    req.params = {};
    
    // Return 403 with no useful info
    return res.status(403).json({
      success: false,
      error: 'Invalid request',
      code: 'FORBIDDEN'
    });
  }

  function blockAttack(req, res, reason) {
    console.log(`Ã°Å¸Å¡Â« ${reason} - IP: ${req.ip}`);
    req.body = {};
    req.query = {};
    req.params = {};
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
}



app.use(waf({
  // All enabled by default, disable what you don't need
  sqlInjection: true,        // Blocks ALL SQL injection
  xss: true,                  // Blocks ALL XSS
  commandInjection: true,     // Blocks ALL command injection
  pathTraversal: true,        // Blocks ALL path traversal
  nosqlInjection: true,       // Blocks ALL NoSQL injection
  prototypePollution: true,   // Blocks ALL prototype pollution
  ssrf: true,                 // Blocks SSRF attacks
  xxe: true,                  // Blocks XXE attacks
  autoSanitize: true          // Light cleaning of normal requests
}));










app.use(helmet({ contentSecurityPolicy:false }))

 
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
    const readFile = JSON.parse(readBlocked).blockedDevices || [];
    
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
//-- ----------------------------------------


function saveErrorLog(req,err){
  try{
    const homeDir = os.homedir();
    const errorPath = path.join(homeDir, "serverErrors");

    if(!fs.existsSync(errorPath)){
      fs.mkdirSync(errorPath, { recursive:true });
    }

    const fileName =
      new Date()
      .toISOString()
      .replace(/[:.]/g, "-") + ".txt";

    const errorFile = path.join(errorPath, fileName);

    fs.appendFileSync(
      errorFile,
      "\n" + (err.stack || err.toString() || err.message) + "\n\n"
    );
      console.log(`\n\x1b[31mÃƒÂ¢Ã…Â¡ ÃƒÂ¯Ã‚Â¸Ã‚Â A User encounted an Error on path:\x1b[1;36m${req.path}\x1b[0m\x1b[31m, and time ${new Date().toISOString()},  please check logs for details\x1b[0m\n`)

  }catch(err){
    console.log("could not save error to file:", err);
  }
}



// other files actions or import actions
app.use(checkBlocked)


app.use(session({
  store : new SQLiteStore({
    db : "session.db",
    dir: "./DataBases"
  }),
  name : "cypher.sid",
  secret : "773879476d5e159873a7a0ccf5779780",
  resave : false,
  saveUninitialized : false,
  cookie :{
    httpOnly:true,
    sameSite : "strict",
      secure : true,
      maxAge : 1000 * 60 * 60 * 24 * 7
  },
    unset : "destroy"
}))


ipRoute(app)
apiWorking(app)
Ping(app)
PreviewImg(app)
Email(app)
GitHub(app)
totalRequests(app)
About(app)
signUpGET(app)
signUpPOST(app)
logOut(app)
logInPOST(app)
logInGET(app)
User(app)
resetPassword(app)


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

app.use((req,res)=>{
    const Path= req.path
    const reqPath = Path.replace("/cyphers","")
  return res.status(404).send(`The requested path, ${reqPath} was not found`)
})


//-------------------------------------------

// Port to listen on
app.listen(`${getPort()}`,"::",()=>{
  console.log(`\x1b[1;33mWeb started runing  at \x1b[0m, \x1b[33m${new Date().toString()}\x1b[0m and \x1b[33m on port ${getPort()}\x1b[0m`)
})


export { saveErrorLog }
// EOF
