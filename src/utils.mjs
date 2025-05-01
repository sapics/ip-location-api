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
const isPostStrReg = /^([a-zA-Z\d]+)$/
const isPostStrReg2 = /^([a-zA-Z\d]+)[-\s]([a-zA-Z\d]+)$/

var postcodeDatabase
export const initPostcodeDatabase = () => {
	postcodeDatabase = [null]
}
export const getPostcodeDatabase = () => {
	return postcodeDatabase
}

const Uint32Max = 0xFFFFFFFF // 4294967295

const createPostcodeDatabase = (postcode) => {
	var idx = postcodeDatabase.indexOf(postcode)
	if(idx === -1){
		idx = postcodeDatabase.length
		postcodeDatabase.push(postcode)
	}
	return [-128, idx]
}

const zeroStartCount = (postcode) => {
	var count = 0
	for(var i = 0; i < postcode.length; i++){
		if(postcode[i] !== '0'){
			break;
		}
		count++
	}
	return count
}

/**
 * @param {number} idx (int8)
 * @param {number} num (uint32)
 * @param {object} database
 */
export const getPostcodeFromDatabase = (idx, num, database) => {
	if(idx < 0) {
		if(idx === -128){
			return database[num]
		}
		idx = -idx
		var str
		if(idx <= 6){
			// string type with hyphen or space
			str = num.toString(36)
		} else {
			// for 7 char string type with hyphen or space
			str = ((idx-6)%36).toString(36) + num.toString(36)
			idx = ((idx-6)/36|0) + 2
		}
		return str.slice(0, idx) + '-' + str.slice(idx)
	}

	if(idx <= 10) {
		// number type
		return '0'.repeat(idx-1) + num
	}
	if(idx <= 20) {
		// string type
		return '0'.repeat(idx-11) + num.toString(36)
	}
	if(idx <= 56) {
		// for 7 char string type
		return (idx-21).toString(36) + num.toString(36)
	}
	// number type with hyphen or space
	idx -= 57
	var zeroCount = idx & 7, r1length = (idx >> 3) + 1
	var r = '0'.repeat(zeroCount) + num.toString(10)
	return r.slice(0, r1length) + '-' + r.slice(r1length)
}

/**
 * @param {string} postcode
 */
export const getPostcodeDatabaseElement = (postcode) => {
	if(!postcode) return [0, 0];
	var idx, num, r
	// number type
	if(isPostNumReg.test(postcode)){
		idx = zeroStartCount(postcode) + 1 // 1-10
		num = parseInt(postcode, 10)
		if(num <= Uint32Max && idx <= 10) return [idx, num]

	} else if(isPostStrReg.test(postcode)){
		// string type
		idx = zeroStartCount(postcode) + 11 // 11-20
		num = parseInt(postcode, 36)
		if(num <= Uint32Max && idx <= 20) return [idx, num]

		// for 7 char string type
		if(postcode[1] !== '0'){
			idx = parseInt(postcode[0], 36) + 21 // 21-56
			num = parseInt(postcode.slice(1), 36)
			if(num <= Uint32Max) return [idx, num]
		}

	} else if(r = isPostNumReg2.exec(postcode)) {
		// number type with hyphen or space
		idx = (((r[1].length-1) * 8) | zeroStartCount(r[1])) + 57 // 57-127
		num = parseInt(r[1] + r[2], 10)
		if(zeroStartCount(r[1]) < 8 && idx <= 127 && num <= Uint32Max) return [idx, num]

	} else if(postcode[0] !== '0' && (r = isPostStrReg2.exec(postcode))){
		// string type with hyphen or space
		idx = r[1].length // 1-6
		num = parseInt(r[1] + r[2], 36)
		if(num <= Uint32Max && idx <= 6) return [-idx, num]

		// for 7 char string type with hyphen or space
		num = r[1].slice(1) + r[2]
		if(num[0] !== '0' && r[1].length > 1){
			idx = parseInt(postcode[0], 36) + (r[1].length-2)*36 + 6 // 1-35 + (0-3) * 36 + 6
			num = parseInt(num, 36)
			if(num <= Uint32Max && idx < 128) return [-idx, num]
		}
	}

	return createPostcodeDatabase(postcode)
}
