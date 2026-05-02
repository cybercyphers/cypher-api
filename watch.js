import fs from 'fs';
import chokidar from 'chokidar';
const Watch= chokidar.watch("./index.js").on("change",async()=>{
 const main = await import(`./index.js?v=${Date.now()}`)
 console.log("file realoded, index.js")
})

export default Watch;
