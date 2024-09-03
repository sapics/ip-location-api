const fs = require('fs')
const path = require('path')
const process = require('process')

const t1 = Date.now()
const geoip = require('../cjs/main.cjs')
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

async function run () {
	for(var ips of [ipv4, ipv6]){
		const n = ips.length
		var r
		var ts, te
		ts = Date.now()
		for (const ip of ips) {
			r = geoip.lookup(ip)
		}
		te = Date.now()
		console.log(ipv4 === ips ? "ipv4" : "ipv6")
		console.log("%d ips %d ms (%s ip/s) (%s μs/ip)", n, te - ts, (n * 1000 / (te - ts)).toFixed(3), ((te - ts) / n * 1000).toFixed(3))
	}
	console.log('')
}
run()

