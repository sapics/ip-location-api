
const path = require('path')










const getFieldsSize = (types) => {
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

const ntoa4 = (n) => {
	return [n >>> 24, n >> 16 & 255, n >> 8 & 255, n & 255].join('.')
}

const aton4 = (a) => {
  a = a.split(/\./)
  return (a[0] << 24 | a[1] << 16 | a[2] << 8 | a[3]) >>> 0
}

const aton6Start = (a) => {
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

const aton6 = (a) => {
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
const v4Mapped = (addr) => {
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

const isPrivateIP = function(addr) {
	for(const reg of PrivateIpRegList){
		if(reg.test(addr)){
			return true
		}
	}
	return false
}

const strToNum37 = (a) => {
	var num = 0
	for(var i = 0; i < a.length; i++){
		num = num * 37 + parseInt(a[i], 36) + 1
	}
	return num
}

const num37ToStr = (num) => {
	var str = ''
	while(num > 0){
		str = (num % 37 - 1).toString(36) + str
		num = Math.floor(num / 37)
	}
	return str.toUpperCase()
}

const getZeroFill = (num, len) => {
	return '0'.repeat(len - num.length) + num
}

const getUnderberFill = (num, len) => {
  return '_'.repeat(len - num.length) + num
}
const numberToDir = (num) => {
	return getUnderberFill(num.toString(36), 2)
}
const getSmallMemoryFile = (line, db, isTmp) => {
	const dbNumber = line / db.folderLineMax | 0
	const fileNumber = (line - dbNumber * db.folderLineMax) / db.fileLineMax | 0
	const lineOffset = line - dbNumber * db.folderLineMax - fileNumber * db.fileLineMax;
	var dir = path.join(db.name + (isTmp ? '-tmp' : ''), getUnderberFill(dbNumber.toString(36), 2))
	return [dir, getUnderberFill(fileNumber.toString(36), 2), lineOffset * db.recordSize]
}

const isPostNumReg = /^\d+$/
const isPostNumReg2 = /^(\d+)[-\s](\d+)$/
const isPostStrReg = /^([A-Z\d]+)$/
const isPostStrReg2 = /^([A-Z\d]+)[-\s]([A-Z\d]+)$/
const getPostcodeDatabase = (postcode) => {
	if(!postcode) return [0, 0];

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

module.exports={getFieldsSize:getFieldsSize,ntoa4:ntoa4,aton4:aton4,aton6Start:aton6Start,aton6:aton6,v4Mapped:v4Mapped,isPrivateIP:isPrivateIP,strToNum37:strToNum37,num37ToStr:num37ToStr,getZeroFill:getZeroFill,numberToDir:numberToDir,getSmallMemoryFile:getSmallMemoryFile,getPostcodeDatabase:getPostcodeDatabase}