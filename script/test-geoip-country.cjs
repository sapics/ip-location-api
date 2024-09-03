const fs = require('fs')
const path = require('path')
const process = require('process')
const utils = require('../cjs/utils.cjs')
const type =  '../cjs/main.cjs' //'./geoip-country5' //  //

console.log('----------------------')
console.log('Using %s', type)
console.log('----------------------')

const t1 = Date.now()
const geoip = require(type)
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
		const results = []
		var r, preIp
		var ts, te
		var isV4 = ips === ipv4
		ts = Date.now()
		for (const ip of ips) {
			r = geoip.lookup(ip)
			results.push(r && r.country)
			if(isV4){
				if(preIp){
					var ne = utils.aton4(ip) + utils.aton4(preIp) >> 1
					var newIp = utils.ntoa4(ne)
					if(newIp !== ip && newIp !== preIp){
						r = geoip.lookup(newIp)
						results.push(r && r.country)
					}
				}
				var ne = utils.aton4(ip) + 1
				var newIp = utils.ntoa4(ne)
				if(newIp !== ip && newIp !== preIp){
					r = geoip.lookup(newIp)
					results.push(r && r.country)
				}
				var ne = utils.aton4(ip) - 2
				var newIp = utils.ntoa4(ne)
				if(newIp !== ip && newIp !== preIp){
					r = geoip.lookup(newIp)
					results.push(r && r.country)
				}
				preIp = ip
			}
		}
		te = Date.now()
		console.log(isV4 ? "ipv4" : "ipv6")
		console.log("%d ips %d ms (%s ip/s) (%s μs/ip)", n, te - ts, (n * 1000 / (te - ts)).toFixed(3), ((te - ts) / n * 1000).toFixed(3))
		const fileName = path.basename(type)
		fs.writeFileSync(path.resolve(__dirname, fileName + (isV4 ? '4' : '6') + '.txt'), results.join('\n'))
	}
	console.log('')
}
run()

