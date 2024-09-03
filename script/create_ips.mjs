//---------------------------------------------------------------------------
// This script is used to create a list of IPs from the GeoLite2 databases.
// Before running this script, download the GeoLite2 databases and put them in the tmp folder.
//---------------------------------------------------------------------------
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {parse} from 'fast-csv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var counter = {}
var ipv4 = [], ipv6 = []
fs.createReadStream(path.resolve(__dirname, '../tmp/GeoLite2-City-Blocks-IPv4.csv'))
	.pipe(parse())
	.on('data', row => {ipv4.push(row[0].split('/')[0])})
	.on('end', () => write('ipv4', ipv4))
fs.createReadStream(path.resolve(__dirname, '../tmp/GeoLite2-City-Blocks-IPv6.csv'))
	.pipe(parse())
	.on('data', row => {ipv6.push(row[0].split('/')[0])})
	.on('end', () => write('ipv6', ipv6))
fs.createReadStream(path.resolve(__dirname, '../tmp/GeoLite2-Country-Blocks-IPv4.csv'))
	.pipe(parse())
	.on('data', row => {ipv4.push(row[0].split('/')[0])})
	.on('end', () => write('ipv4', ipv4))
fs.createReadStream(path.resolve(__dirname, '../tmp/GeoLite2-Country-Blocks-IPv6.csv'))
	.pipe(parse())
	.on('data', row => {ipv6.push(row[0].split('/')[0])})
	.on('end', () => write('ipv6', ipv6))

function write(str, ips){
	if(!counter[str]) counter[str] = 1
	else {
		ips.shift()
		ips.sort(() => Math.random() - 0.5)
		fs.writeFileSync(path.resolve(__dirname, str + '.txt'), ips.join('\n'))
	}
}
