import path from 'path'

// export const DEBUG = process.argv.includes('debug')

//export const MaxLocationId = 0xFFFFFFFF - 26*26
export const countryCodeToNum = (code) => { // 0~675
	code = code.toUpperCase()
	return (code.charCodeAt(0)-65)*26 + (code.charCodeAt(1)-65)
}
export const numToCountryCode = (num) => {
	return String.fromCharCode((num/26|0) + 65, num % 26 + 65)
}

export const getFieldsSize = (types) => {
	var size = 0
	for (const type of types) {
		switch (type) {
			case 'postcode':
				size += 5
				break
			case 'area':
				size += 1
				break
			case 'latitude':
			case 'longitude':
			case 'city':
				size += 4
				break
			case 'eu':
				break
			default:
				size += 2
				break
		}
	}
	return size
}

export const ntoa4 = (n) => {
	return [n >>> 24, n >> 16 & 255, n >> 8 & 255, n & 255].join('.')
}

export const aton4 = (a) => {
  a = a.split(/\./)
  return (a[0] << 24 | a[1] << 16 | a[2] << 8 | a[3]) >>> 0
}

export const aton6Start = (a) => {
  if(a.includes('.')){
    return aton4(a.split(':').pop())
  }
  a = a.split(/:/)
  const l = a.length - 1
  var i, r = 0n
  if (l < 7) {
		const omitStart = a.indexOf('')
		if(omitStart < 4){
			const omitted = 8 - a.length, omitEnd = omitStart + omitted
			for (i = 7; i >= omitStart; i--) {
				a[i] = i > omitEnd ? a[i - omitted] : 0
			}
		}
  }
  for (i = 0; i < 4; i++) {
    if(a[i]) r += BigInt(parseInt(a[i], 16)) << BigInt(16 * (3 - i))
  }
  return r
}

export const aton6 = (a) => {
	a = a.replace(/"/g, '').split(/:/)

	const l = a.length - 1
	var i
  if (a[l] === '') a[l] = 0
  if (l < 7) {
		const omitted = 8 - a.length, omitStart = a.indexOf(''), omitEnd = omitStart + omitted
		for (i = 7; i >= omitStart; i--) {
			a[i] = i > omitEnd ? a[i - omitted] : 0
		}
	}

	var r = 0n
	for (i = 0; i < 4; i++) {
		if (a[i]) {
			r += BigInt(parseInt(a[i], 16)) << BigInt(16 * (3 - i))
		}
	}
	return r
}

const v4MappedReg = /^(?:0:0:0:0:0|:):ffff:(\d+\.\d+\.\d+\.\d+)$/i
export const v4Mapped = (addr) => {
	const match = v4MappedReg.exec(addr)
	return match && match[1]
}

const PrivateIpRegList = [
	/^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/,
	/^192\.168\.([0-9]{1,3})\.([0-9]{1,3})/,
	/^172\.16\.([0-9]{1,3})\.([0-9]{1,3})/,
	/^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/,
	/^169\.254\.([0-9]{1,3})\.([0-9]{1,3})/,
	/^fc00:/,
	/^fe80:/
]

export const isPrivateIP = function(addr) {
	for(const reg of PrivateIpRegList){
		if(reg.test(addr)){
			return true
		}
	}
	return false
}

export const strToNum37 = (a) => {
	var num = 0
	for(var i = 0; i < a.length; i++){
		num = num * 37 + parseInt(a[i], 36) + 1
	}
	return num
}

export const num37ToStr = (num) => {
	var str = ''
	while(num > 0){
		str = (num % 37 - 1).toString(36) + str
		num = Math.floor(num / 37)
	}
	return str.toUpperCase()
}

export const getZeroFill = (num, len) => {
	return '0'.repeat(len - num.length) + num
}

const getUnderberFill = (num, len) => {
	if(num.length > len) return num
  return '_'.repeat(len - num.length) + num
}
export const numberToDir = (num) => {
	return getUnderberFill(num.toString(36), 2)
}
export const getSmallMemoryFile = (line, db, isTmp) => {
	const dbNumber = line / db.folderLineMax | 0
	const fileNumber = (line - dbNumber * db.folderLineMax) / db.fileLineMax | 0
	const lineOffset = line - dbNumber * db.folderLineMax - fileNumber * db.fileLineMax
	var dir = path.join(db.name + (isTmp ? '-tmp' : ''), getUnderberFill(dbNumber.toString(36), 2))
	return [dir, getUnderberFill(fileNumber.toString(36), 2), lineOffset * db.recordSize]
}

const isPostNumReg = /^\d+$/
const isPostNumReg2 = /^(\d+)[-\s](\d+)$/
const isPostStrReg = /^([A-Z\d]+)$/
const isPostStrReg2 = /^([A-Z\d]+)[-\s]([A-Z\d]+)$/
export const getPostcodeDatabase = (postcode) => {
	if(!postcode) return [0, 0];
	// number type
	if(isPostNumReg.test(postcode)){
		return [
			postcode.length, // 1~9
			parseInt(postcode, 10) // 0~999999999
		]
	}
	var r = isPostNumReg2.exec(postcode)
	if(r){
		return [
			parseInt(r[1].length + '' + r[2].length, 10), // 11~66
			parseInt(r[1] + r[2], 10) // 0~999999999
		]
	}

	// string type
	r = isPostStrReg.exec(postcode)
	if(r){
		var num = parseInt(postcode, 36)
		if(num < Math.pow(2, 32)){
			return [
				-postcode.length, // -1~-9
				num
			]
		} else {
			return [
				parseInt('2' + postcode.slice(0, 1), 36), // 72~107,
				parseInt(postcode.slice(1), 36) // 0~2176782335 MAX: 6char ZZZZZZ
			]
		}
	}

	r = isPostStrReg2.exec(postcode)
	if(!r){
		console.log('Invalid postcode:', postcode)
	}
	return [
		- parseInt(r[1].length + "" + r[2].length, 10),// -11~-55
		parseInt(r[1] + r[2], 36) // 0~2176782335 MAX: 6char ZZZZZZ
	]
}
