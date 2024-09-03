
import fsSync from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

var __filename = fileURLToPath(import.meta.url)
var __dirname = path.dirname(__filename)

var files = fsSync.readdirSync(path.resolve(__dirname, '..', 'src'))

for(var file of files){
	if(file.endsWith('.mjs')){
		var src = fsSync.readFileSync(path.resolve(__dirname, '..', 'src', file), 'utf8')
		var exportList = []
		src = src.replace(/\nconst __filename[^\n]+/, '')
		src = src.replace(/\nconst __dirname[^\n]+/, '')
		src = src.replace(/\n\s*\/\/[^\n]+/g, '\n')
		src = src.replace(/\nawait reload\(\)/g, 'reload(undefined, true)')// remove top level await
		src = src.replace(/\nawait\s+[^\n]+/g, '\n')// remove top level await
		src = src.replace(/\nexport\s+const\s+(\w+)/g, (m, p1) => {
			exportList.push(p1)
			return '\nconst ' + p1
		})
		src = src.replace(/\nexport\s+const\s+(\w+)/g, '\nconst $1 = exports.$1')
		src = src.replace(/(?:\n|^)import\s+([^\n]+)\s+from([^\n]+)/g, (m, p1, p2) => {
			return '\nconst ' + p1 + ' = require(' + p2.replace(".mjs'", ".cjs'").replace(".mjs\"", ".cjs\"").trim() + ')'
		})
//		src = src.replace("const fs = require('fs/promises')", "var fs;\ntry{ fs=require('fs/promises') }catch(e){ fs=require('fs').promises }\n")
		src = src.replace('export { setting }', '')

		src += '\nmodule.exports={' + exportList.map(v => v+':'+v).join(',') + '}'

		var dstPath = path.resolve(__dirname, '..', 'cjs', file.replace(/\.mjs$/, '.cjs'))
		fsSync.writeFileSync(dstPath, src)
	}
}
