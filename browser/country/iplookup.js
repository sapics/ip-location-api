var IpLookup = (function () {
	'use strict';

	const aton4 = (a) => {
	  a = a.split(/\./);
	  return (a[0] << 24 | a[1] << 16 | a[2] << 8 | a[3]) >>> 0
	};

	const aton6Start = (a) => {
	  if(a.includes('.')){
	    return aton4(a.split(':').pop())
	  }
	  a = a.split(/:/);
	  const l = a.length - 1;
	  var i, r = 0n;
	  if (l < 7) {
			const omitStart = a.indexOf('');
			if(omitStart < 4){
				const omitted = 8 - a.length, omitEnd = omitStart + omitted;
				for (i = 7; i >= omitStart; i--) {
					a[i] = i > omitEnd ? a[i - omitted] : 0;
				}
			}
	  }
	  for (i = 0; i < 4; i++) {
	    if(a[i]) r += BigInt(parseInt(a[i], 16)) << BigInt(16 * (3 - i));
	  }
	  return r
	};

	const getUnderberFill = (num, len) => {
		if(num.length > len) return num
	  return '_'.repeat(len - num.length) + num
	};
	const numberToDir = (num) => {
		return getUnderberFill(num.toString(36), 2)
	};

	const TOP_URL = document.currentScript.src.split('/').slice(0, -1).join('/') + '/';
	const MAIN_RECORD_SIZE = 2 ;
	const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

	const downloadArrayBuffer = async(url, retry = 3) => {
		return fetch(url, {cache: 'no-cache'}).then(async (res) => {
			if(!res.ok) {
				if(res.status === 404) return null
				if(retry) {
					await sleep(100 * (4-retry) * (4-retry));
					return downloadArrayBuffer(url, retry - 1)
				}
				return null
			}
			return res.arrayBuffer()
		})
	};

	const downloadIdx = downloadArrayBuffer;

	const Idx = {}, Url = {4: TOP_URL, 6: TOP_URL};
	const Preload = {
		4: downloadIdx(TOP_URL + '4.idx').then(buf => {
			if(!buf){
	//			console.log('ipv6 file cannot download')
				return
			}
			return Idx[4] = new Uint32Array(buf)
		}),
		6: downloadIdx(TOP_URL + '4.idx').then(buf => {
			if(!buf){
	//			console.log('ipv6 file cannot download')
				return
			}
			return Idx[6] = new BigUint64Array(buf)
		})
	};

	var browser = async (ipString) => {
		var ip, version, isv4 = true;
		if(ipString.includes(':')) {
			ip = aton6Start(ipString);
			version = ip.constructor === BigInt ? 6 : 4;
			if(version === 6) isv4 = false;
		} else {
			ip = aton4(ipString);
			version = 4;
		}
		
		const ipIndexes = Idx[version] || (await Preload[version]);
		if(!ipIndexes) {
	//		console.log('Cannot download idx file')
			return null
		}
		if(!(ip >= ipIndexes[0])) return null
		var fline = 0, cline = ipIndexes.length-1, line;
		for(;;){
			line = (fline + cline) >> 1;
			if(ip < ipIndexes[line]){
				if(cline - fline < 2) return null
				cline = line - 1;
			} else {
				if(fline === line) {
					if(cline > line && ip >= ipIndexes[cline]){
						line = cline;
					}
					break;
				}
				fline = line;
			}
		}

		const fileName = numberToDir(line);
		const dataBuffer = await downloadArrayBuffer(Url[version] + version + '/' + fileName);
		if(!dataBuffer) {
	//		console.log('Cannot download data file')
			return null
		}
		const ipSize = (version - 2) * 2;
		const recordSize = MAIN_RECORD_SIZE + ipSize * 2;
		const recordCount = dataBuffer.byteLength / recordSize;
		const startList = isv4 ? new Uint32Array(dataBuffer.slice(0, 4 * recordCount)) : new BigUint64Array(dataBuffer.slice(0, 8 * recordCount));
		fline = 0, cline = recordCount - 1;
		for(;;){
			line = fline + cline >> 1;
			if(ip < startList[line]){
				if(cline - fline < 2) return null
				cline = line - 1;
			} else {
				if(fline === line) {
					if(cline > line && ip >= startList[cline]){
						line = cline;
					}
					break;
				}
				fline = line;
			}
		}
		const endIp = isv4 ? new Uint32Array(   dataBuffer.slice((recordCount+line)*ipSize , (recordCount+line+1)*ipSize))[0]
											 : new BigUint64Array(dataBuffer.slice((recordCount+line)*ipSize , (recordCount+line+1)*ipSize))[0];
		if(ip >= startList[line] && ip <= endIp){
			{
				const ccCode = new Uint16Array(dataBuffer.slice(recordCount*ipSize*2+line*MAIN_RECORD_SIZE, recordCount*ipSize*2+(line+1)*MAIN_RECORD_SIZE))[0];
				return {country: String.fromCharCode(ccCode&255, ccCode>>8)}
			}
		}
		return null
	};

	return browser;

})();
