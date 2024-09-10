
import { aton4, aton6Start, numberToDir } from './utils.mjs'
import { IndexLineEnd, downloadBuffer } from './browser_utils.mjs'

//const TOP_URL = 'https://cdn.test.com/data/'
// const TOP_URL = 'country/'

const TOP_URL = document.currentScript.src.split('/').slice(0, -1).join('/') + '/'

const MAIN_RECORD_SIZE = 2

const Idx = {}
const Preload = {
	4: downloadBuffer(TOP_URL + '4.idx').then(buf => {
		return Idx[4] = new Uint32Array(buf)
	}),
	6: downloadBuffer(TOP_URL + '6.idx').then(buf => {
		return Idx[6] = new BigUint64Array(buf)
	})
}

export default async (ipString) => {
	var ip, version, isv4 = true
	if(ipString.includes(':')) {
		ip = aton6Start(ipString)
		version = ip.constructor === BigInt ? 6 : 4
		if(version === 6) isv4 = false
	} else {
		ip = aton4(ipString)
		version = 4
	}
	
	const ipIndexes = Idx[version] || (await Preload[version])
	if(!(ip >= ipIndexes[0])) return null
	var fline = 0, cline = IndexLineEnd, line
	for(;;){
		line = (fline + cline) >> 1
		if(ip < ipIndexes[line]){
			if(cline - fline < 2) return null
			cline = line - 1
		} else {
			if(fline === line) {
				if(cline > line && ip >= ipIndexes[cline]){
					line = cline
				}
				break;
			}
			fline = line
		}
	}

	const fileName = numberToDir(line)
	const dataBuffer = await downloadBuffer(TOP_URL + version + '/' + fileName)
	const ipSize = (version - 2) * 2
	const recordSize = MAIN_RECORD_SIZE + ipSize * 2
	const recordCount = dataBuffer.byteLength / recordSize
	const startList = isv4 ? new Uint32Array(dataBuffer.slice(0, 4 * recordCount)) : new BigUint64Array(dataBuffer.slice(0, 8 * recordCount))
	fline = 0, cline = recordCount - 1
	for(;;){
		line = fline + cline >> 1
		if(ip < startList[line]){
			if(cline - fline < 2) return null
			cline = line - 1
		} else {
			if(fline === line) {
				if(cline > line && ip >= startList[cline]){
					line = cline
				}
				break;
			}
			fline = line
		}
	}
	const endIp = new Uint32Array(dataBuffer.slice((recordCount+line)*ipSize , (recordCount+line+1)*ipSize))[0]
	if(ip >= startList[line] && ip <= endIp){
		const ccCode = new Uint16Array(dataBuffer.slice(recordCount*ipSize*2+line*2, recordCount*ipSize*2+line*2+2))[0]
		return {country: String.fromCharCode(ccCode&255, ccCode>>8)}
	}
	return null
}