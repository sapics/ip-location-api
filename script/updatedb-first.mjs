
import {update} from '../src/db.mjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var dataFile = path.join(__dirname, '../data/4-1.dat')
if(!fs.existsSync(dataFile)) {
	update()
}
