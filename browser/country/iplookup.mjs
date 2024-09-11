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

//----------------------------
// COUNTRY: IndexLoop = 10
//----------------------------
// IPv4: 1172844 >> 2 = 293211 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*4 = 4096 bytes
// COUNTRY_FILE_SIZE = Math.ceil(293211 / IndexSize) * (4 + 4 + 2) = 2870 bytes
// IPv6: 1914064 >> 3 = 146605 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*8 = 8192 bytes
// COUNTRY_FILE_SIZE = Math.ceil(146605 / IndexSize) * (8 + 8 + 2) = 144 * 18 = 2592 bytes


//----------------------------
// LATITUDE + LONGITUDE:  IndexLoop = 11
//----------------------------
// IPv4: 6474072 >> 2 = 1,618,518 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*4 = 8192 bytes
// COUNTRY_FILE_SIZE = Math.ceil(1618518 / IndexSize) * (4 + 4 + 4 + 4) = 791 * 16 = 12656 bytes
// IPv6: 7621144 >> 3 = 952,643 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*8 = 16384 bytes
// COUNTRY_FILE_SIZE = Math.ceil(952643 / IndexSize) * (8 + 8 + 4 + 4) = 466 * 24 = 11184 bytes


const downloadBuffer = async (url) => {
	return fetch(url, {cache: 'no-cache'}).then(res => res.arrayBuffer())
};

const TOP_URL = "https://cdn.jsdelivr.net/npm/@iplookup/country/";
const MAIN_RECORD_SIZE = 2 ;

const Idx = {};
const Preload = {
	4: downloadBuffer(TOP_URL + '4.idx').then(buf => {
		return Idx[4] = new Uint32Array(buf)
	}),
	6: downloadBuffer(TOP_URL + '6.idx').then(buf => {
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
	const dataBuffer = await downloadBuffer(TOP_URL + version + '/' + fileName);
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

export { browser as default };
