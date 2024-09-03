import fs from 'fs'
import path from 'path'
import { isIP } from 'net'
import { fileURLToPath } from 'url'
import process from 'process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var ipv4 , ipv6 
try {
	ipv4 = fs.readFileSync(path.resolve(__dirname, 'ipv4.txt'), 'utf8').split('\n')
	ipv6 = fs.readFileSync(path.resolve(__dirname, 'ipv6.txt'), 'utf8').split('\n')
} catch (e) {
	console.error("Please run create_ips.js first")
	process.exit(1)
}

for(var loop = 0; loop < 2; ++loop){
	if(loop === 0){
		console.log('---------------------')
		console.log('string check')
		console.log('---------------------')
	} else {
		console.log('---------------------')
		console.log('isIP')
		console.log('---------------------')
	}
	for(var ips of [ipv4, ipv6]){
		const n = ips.length
		var r
		var ts, te
		ts = Date.now()
		if(loop === 0){
			for(const ip of ips){
				r = ip.includes(':') ? 6 : 4
			}
		} else {
			for(const ip of ips){
				r = isIP(ip)
			}
		}
		te = Date.now()
		console.log(ipv4 === ips ? "ipv4" : "ipv6")
		console.log("%d ips %d ms (%s ip/s) (%s μs/ip)", n, te - ts, (n * 1000 / (te - ts)).toFixed(3), ((te - ts) / n * 1000).toFixed(3))
	}
}
