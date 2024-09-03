import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'process'

import { lookup, reload } from '../src/main.mjs'
import { setting } from '../src/setting.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const t1 = Date.now()
await reload()
const t2 = Date.now()
console.log("Took %d ms to startup", t2 - t1)

var ipv4 , ipv6 
try {
	ipv4 = fs.readFileSync(path.resolve(__dirname, 'ipv4.txt'), 'utf8').split('\n')
	ipv6 = fs.readFileSync(path.resolve(__dirname, 'ipv6.txt'), 'utf8').split('\n')
} catch (e) {
	console.error("Please run create_ips.js first")
	process.exit(1)
}

for(var ips of [ipv4, ipv6]){
	if(setting.smallMemory){
		ips.length = 10000
	}
	const n = ips.length
	var r
	var ts, te
	if(setting.smallMemory){
		ts = Date.now()
		for (const ip of ips) {
			r = await lookup(ip)
		}
		te = Date.now()
	} else {
		ts = Date.now()
		for (const ip of ips) {
			r = lookup(ip)
		}
		te = Date.now()
	}
	console.log(ipv4 === ips ? "ipv4" : "ipv6")
	console.log("%d ips %d ms (%s ip/s) (%s μs/ip)", n, te - ts, (n * 1000 / (te - ts)).toFixed(3), ((te - ts) / n * 1000).toFixed(3))
}
