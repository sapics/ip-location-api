
import {update} from '../src/db.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var dataDir = path.join(__dirname, '../data')
var hasDataDir = true
try{
	if(!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir)
	}
}catch(e){
	// No write access permission
	hasDataDir = false
	console.log(e)
}

var dataFile = path.join(__dirname, '../data/4-1.dat')
if(hasDataDir && !fs.existsSync(dataFile)) {
	update()
}
