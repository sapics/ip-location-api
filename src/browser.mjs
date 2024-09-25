
import { aton4, aton6Start, numberToDir, numToCountryCode } from './utils.mjs'

const TOP_URL = __CDNURL__ || document.currentScript.src.split('/').slice(0, -1).join('/') + '/'
const MAIN_RECORD_SIZE = __DATA_TYPE__ === 'country' ? 2 : 8
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const downloadArrayBuffer = async(url, retry = 3) => {
	return fetch(url, {cache: 'no-cache'}).then(async (res) => {
		if(!res.ok) {
			if(res.status === 404) return null
			if(retry) {
				await sleep(100 * (4-retry) * (4-retry))
				return downloadArrayBuffer(url, retry - 1)
			}
			return null
		}
		return res.arrayBuffer()
	})
}

const downloadVersionArrayBuffer = async(url, retry = 3) => {
	return fetch(url, {cache: 'no-cache'}).then(async (res) => {
		if(!res.ok) {
			if(res.status === 404) return null
			if(retry) {
				await sleep(100 * (4-retry) * (4-retry))
				return downloadVersionArrayBuffer(url, retry - 1)
			}
			return null
		}
		return [res.headers.get('x-jsd-version'), await res.arrayBuffer()]
	})
}

const downloadIdx = __CDNURL__ ? downloadVersionArrayBuffer : downloadArrayBuffer

const Idx = {}, Url = {4: TOP_URL, 6: TOP_URL}
const Preload = {
	4: downloadIdx(TOP_URL + '4.idx').then(buf => {
		if(!buf){
//			console.log('ipv6 file cannot download')
			return
		}
		if(__CDNURL__ && buf[0]) {
			Url[4] = __CDN_URL__.replace(/\/$/, '@'+buf[0]+'/')
			return Idx[4] = new Uint32Array(buf[1])
		}
		return Idx[4] = new Uint32Array(buf)
	}),
	6: downloadIdx(TOP_URL + '4.idx').then(buf => {
		if(!buf){
//			console.log('ipv6 file cannot download')
			return
		}
		if(__CDNURL__ && buf[0]) {
			Url[6] = __CDN_URL__.replace(/\/$/, '@'+buf[0]+'/')
			return Idx[6] = new BigUint64Array(buf.slice(1))
		}
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
	if(!ipIndexes) {
//		console.log('Cannot download idx file')
		return null
	}
	if(!(ip >= ipIndexes[0])) return null
	var fline = 0, cline = ipIndexes.length-1, line
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
	const dataBuffer = await downloadArrayBuffer(Url[version] + version + '/' + fileName)
	if(!dataBuffer) {
//		console.log('Cannot download data file')
		return null
	}
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
	const endIp = isv4 ? new Uint32Array(   dataBuffer.slice((recordCount+line)*ipSize , (recordCount+line+1)*ipSize))[0]
										 : new BigUint64Array(dataBuffer.slice((recordCount+line)*ipSize , (recordCount+line+1)*ipSize))[0]
	if(ip >= startList[line] && ip <= endIp){
		if(__DATA_TYPE__ === 'country'){
			const ccCode = new Uint16Array(dataBuffer.slice(recordCount*ipSize*2+line*MAIN_RECORD_SIZE, recordCount*ipSize*2+(line+1)*MAIN_RECORD_SIZE))[0]
			return {country: String.fromCharCode(ccCode&255, ccCode>>8)}
		} else {
			const arr = new Int32Array(dataBuffer.slice(recordCount*ipSize*2+line*MAIN_RECORD_SIZE, recordCount*ipSize*2+(line+1)*MAIN_RECORD_SIZE))
			const ccCode = numToCountryCode(arr[0] & 1023)
			return {latitude: ((arr[0]>>10)) / 10000, longitude: (arr[1]) / 10000, country: ccCode}
		}
	}
	return null
}