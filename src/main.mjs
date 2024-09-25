
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { exec, execSync } from 'child_process'
import { fileURLToPath } from "url"

import { countries, continents } from 'countries-list'
import { CronJob } from 'cron'

import { setting, setSetting, getSettingCmd, consoleLog, consoleWarn } from './setting.mjs'
import { num37ToStr, getSmallMemoryFile, getZeroFill, aton6Start, aton4 } from './utils.mjs'

const v4db = setting.v4
const v6db = setting.v6
const locFieldHash = setting.locFieldHash
const mainFieldHash = setting.mainFieldHash

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//---------------------------------------
// Database lookup
//---------------------------------------
/**
 * @param {string} ip - ipv4 or ipv6 formatted address
 * @returns {object|null|Promise} location information
 */
export const lookup = (ip) => {
	// net.isIP(ip) is good for checking ip address format
	// but it's slow for checking ipv6 address
	// therefore, we use ip.includes(':') instead
	var isIpv6
	if(ip.includes(':')){
		ip = aton6Start(ip)
		isIpv6 = ip.constructor === BigInt
	} else {
		ip = aton4(ip)
		isIpv6 = false
	}
	const db = isIpv6 ? v6db : v4db
	if(!(ip >= db.firstIp)) return null
	const list = db.startIps
	var fline = 0, cline = db.lastLine, line
	for(;;){
		line = fline + cline >> 1
		if(ip < list[line]){
			if(cline - fline < 2) return null
			cline = line - 1
		} else {
			if(fline === line) {
				if(cline !== line && ip >= list[cline]) {
					line = cline
				}
				break
			}
			fline = line
		}
	}

	if(setting.smallMemory){
		// this case return Promise
		return lineToFile(line, db).then(buffer => {
			var endIp = isIpv6 ? buffer.readBigUInt64LE(0) : buffer.readUInt32LE(0)
			if(ip > endIp) return null
			if(setting.isCountry){
				return setCountryInfo({
					country: buffer.toString('latin1', isIpv6 ? 8 : 4, isIpv6 ? 10 : 6)
				})
			}
			return setCityRecord(buffer, {}, isIpv6 ? 8 : 4)
		})
	}
	if(ip > db.endIps[line]) return null
	if(setting.isCountry){
		return setCountryInfo({
			country: db.mainBuffer.toString('latin1', line * db.recordSize, line * db.recordSize + 2)
		})
	}
	return setCityRecord(db.mainBuffer, {}, line * db.recordSize)
}

/**
 * setup database without reload
 * @param {object} [_setting]
 * @returns {void}
 */
export const setupWithoutReload = setSetting

/**
 * clear in-memory database
 */
export const clear = () => {
	v4db.startIps = v6db.startIps = v4db.endIps = v6db.endIps = v4db.mainBuffer = v6db.mainBuffer = null
	Region1NameJson = Region2NameJson = TimezoneJson = LocBuffer = CityNameBuffer = EuJson = null
}

var Region1NameJson, Region2NameJson, TimezoneJson, LocBuffer, CityNameBuffer, AreaJson, EuJson
var updateJob
/**
 * reload in-memory database
 * @param {object} [_setting]
 * @param {boolean} [sync] - sync mode
 * @param {boolean} [_runningUpdate] - if it's running update [internal use]
 * @returns {Promise<void>}
 */
export const reload = async (_setting, sync, _runningUpdate) => {
	var curSetting = setting
	if(_setting){
		var oldSetting = Object.assign({}, setting)
		setSetting(_setting)
		curSetting = Object.assign({}, setting)
		Object.assign(setting, oldSetting)
	}
	const dataDir = curSetting.fieldDir
	const v4 = v4db, v6 = v6db
	var dataFiles = {
		v41:           path.join(dataDir, '4-1.dat'),
		v42:           path.join(dataDir, '4-2.dat'),
		v43:           path.join(dataDir, '4-3.dat'),
		v61:           path.join(dataDir, '6-1.dat'),
		v62:           path.join(dataDir, '6-2.dat'),
		v63:           path.join(dataDir, '6-3.dat'),
		cityLocation: path.join(dataDir, 'location.dat'),
		cityName:     path.join(dataDir, 'name.dat'),
		citySub: 		  path.join(dataDir, 'sub.json')
	}

	var locBuffer, cityNameBuffer, subBuffer
	var buffer41, buffer42, buffer43, buffer61, buffer62, buffer63
	var testDir = dataDir
	if(curSetting.smallMemory){
		testDir = path.join(testDir, 'v4')
	}

	if(sync){
		if(!fsSync.existsSync(testDir)){
			consoleLog('Database creating ...')
			updateDb(curSetting, true, true)
			consoleLog('Database created')
		}
		buffer41 = fsSync.readFileSync(dataFiles.v41)
		buffer61 = fsSync.readFileSync(dataFiles.v61)
		if(!curSetting.smallMemory){
			buffer42 = fsSync.readFileSync(dataFiles.v42)
			buffer43 = fsSync.readFileSync(dataFiles.v43)
			buffer62 = fsSync.readFileSync(dataFiles.v62)
			buffer63 = fsSync.readFileSync(dataFiles.v63)
		}
		if(curSetting.locFile){
			locBuffer = fsSync.readFileSync(dataFiles.cityLocation)
			if(locFieldHash.city){
				cityNameBuffer = fsSync.readFileSync(dataFiles.cityName)
			}
			if(locFieldHash.region1_name || locFieldHash.region2_name || locFieldHash.timezone || mainFieldHash.area || locFieldHash.eu){
				subBuffer = fsSync.readFileSync(dataFiles.citySub)
			}
		}
	} else {
		if(!fsSync.existsSync(testDir)){
			consoleLog('Database creating ...')
			await updateDb(curSetting, true)
			consoleLog('Database created')
		}
		var prs = [
			fs.readFile(dataFiles.v41).then(data => buffer41 = data),
			fs.readFile(dataFiles.v61).then(data => buffer61 = data),
		]
		if(!curSetting.smallMemory){
			prs.push(
				fs.readFile(dataFiles.v42).then(data => buffer42 = data),
				fs.readFile(dataFiles.v43).then(data => buffer43 = data),
				fs.readFile(dataFiles.v62).then(data => buffer62 = data),
				fs.readFile(dataFiles.v63).then(data => buffer63 = data)
			)
		}
		if(curSetting.locFile){
			prs.push(fs.readFile(dataFiles.cityLocation).then(data => locBuffer = data))
			if(locFieldHash.city){
				prs.push(fs.readFile(dataFiles.cityName).then(data => cityNameBuffer = data))
			}
			if(locFieldHash.region1_name || locFieldHash.region2_name || locFieldHash.timezone || mainFieldHash.area || locFieldHash.eu){
				prs.push(fs.readFile(dataFiles.citySub).then(data => subBuffer = data))
			}
		}
		await Promise.all(prs)
	}

	if(_setting){
		Object.assign(setting, curSetting)
	}

	v4.startIps = new Uint32Array(buffer41.buffer, 0, buffer41.byteLength >> 2)
	v6.startIps = new BigUint64Array(buffer61.buffer, 0, buffer61.byteLength >> 3)
	if(!curSetting.smallMemory){
		v4.endIps = new Uint32Array(buffer42.buffer, 0, buffer42.byteLength >> 2)
		v4.mainBuffer = buffer43
		v6.endIps = new BigUint64Array(buffer62.buffer, 0, buffer62.byteLength >> 3)
		v6.mainBuffer = buffer63
	}

	v4.lastLine = v4.startIps.length - 1
	v6.lastLine = v6.startIps.length - 1
	v4.firstIp = v4.startIps[0]
	v6.firstIp = v6.startIps[0]
	if(curSetting.isCity){
		LocBuffer = locBuffer
		CityNameBuffer = cityNameBuffer
		if(subBuffer){
			var tmpJson = JSON.parse(subBuffer)
			if(locFieldHash.region1_name) Region1NameJson = tmpJson.region1_name
			if(locFieldHash.region2_name) Region2NameJson = tmpJson.region2_name
			if(locFieldHash.timezone) TimezoneJson = tmpJson.timezone
			if(mainFieldHash.area) AreaJson = tmpJson.area
			if(locFieldHash.eu) EuJson = tmpJson.eu
		}
	}

	// To avoid the error (when the database is updated while the server is running),
	// we need to syncronous update the database
	if(setting.smallMemory && _runningUpdate){
		const rimraf = (dir) => {
			if(fs.rm){
				return fs.rm(dir, {recursive: true, force: true, maxRetries: 3})
			}
			return fs.rmdir(dir, {recursive: true, maxRetries: 3})
		}
		fsSync.cpSync(path.join(setting.fieldDir, 'v4-tmp'), path.join(setting.fieldDir, 'v4'), {recursive: true, force: true})
		fsSync.cpSync(path.join(setting.fieldDir, 'v6-tmp'), path.join(setting.fieldDir, 'v6'), {recursive: true, force: true})
		rimraf(path.join(setting.fieldDir, 'v4-tmp')).catch(consoleWarn)
		rimraf(path.join(setting.fieldDir, 'v6-tmp')).catch(consoleWarn)
	}

	if(!updateJob && setting.autoUpdate){
		updateJob = new CronJob(setting.autoUpdate, () => {
			updateDb().finally(() => {})
		}, null, true, 'UTC')
	} else if(updateJob && !setting.autoUpdate){
		updateJob.stop()
		updateJob = null
	}
}

const watchHash = {}
/**
 * Watch database directory.
 * When database file is updated, it reload the database automatically
 * This causes error if you use ILA_SMALL_MEMORY=true
 * @param {string} [name] - name of watch. If you want to watch multiple directories, you can set different name for each directory
 */
export const watchDb = (name = 'ILA') => {
	var watchId = null
	watchHash[name] = fsSync.watch(setting.fieldDir, (eventType, filename) => {
		if(!filename.endsWith('.dat')) return;
		if(fsSync.existsSync(path.join(setting.fieldDir, filename))) {
			if(watchId) clearTimeout(watchId)
			watchId = setTimeout(reload, 30 * 1000)
		}
	})
}

/**
 * Stop watching database directory
 * @param {string} [name] 
 */
export const stopWatchDb = (name = 'ILA') => {
	if(watchHash[name]){
		watchHash[name].close()
		delete watchHash[name]
	}
}

/**
 * Update database and auto reload database
 * @param {object} [_setting] - if you need to update the database with different setting
 * @param {boolean} [noReload] - if you don't want to reload the database after update
 * @param {boolean} [sync] - if you want to update the database in sync mode
 * @returns {Promise<boolean>} - true if database is updated, false if no need to update
 */
export const updateDb = (_setting, noReload, sync) => {
	// By import { updateDb } from './db.js' is the better way for update.
	// However, db.js import many external modules, it makes slow down the startup time and uses more memory.
	// Therefore, we use exec() to run the script in the other process.
	var cmd = 'node ' + path.resolve(__dirname, '..', 'script', 'updatedb.mjs')
	var arg, runningUpdate = false
	if(_setting){
		var oldSetting = Object.assign({}, setting)
		setSetting(_setting)
		arg = getSettingCmd()
		Object.assign(setting, oldSetting)
	} else {
		arg = getSettingCmd()
	}
	if(!_setting){
		arg += ' ' + 'ILA_SAME_DB_SETTING=true'
	}
	if(_setting && _setting.smallmemory || !_setting && setting.smallMemory){
		runningUpdate = true
		arg += ' ILA_RUNNING_UPDATE=true'
	}

	if(arg){
		cmd += ' ' + arg
	}
	if(sync){
		try{
			var stdout = execSync(cmd)
			if(stdout.includes('NO NEED TO UPDATE')){
				return true
			}
			if(stdout.includes('SUCCESS TO UPDATE')){
				if(!noReload){
					reload(_setting, sync)
				}
				return true
			}
			return false
		}catch(e){
			consoleWarn(e)
			return false
		}
	}
	return new Promise((resolve, reject) => {
		exec(cmd, (err, stdout, stderr) => {
			if(err) {
				consoleWarn(err)
			}
			if(stderr) {
				consoleWarn(stderr)
			}
			if(stdout) {
				consoleLog(stdout)
			}
			if(err) {
				reject(err)
			} else if(stdout.includes('ERROR TO UPDATE')){
				reject(new Error('ERROR TO UPDATE'))
			} else if(stdout.includes('NO NEED TO UPDATE')){
				resolve(false)
			} else if(stdout.includes('SUCCESS TO UPDATE')){
				if(noReload){
					resolve(true)
				} else {
					reload(_setting, false, runningUpdate).then(() => {
						resolve(true)
					}).catch(reject)
				}
			} else {
				consoleLog('UNKNOWN ERROR')
				reject(new Error('UNKNOWN ERROR'))
			}
		})
	})
}

/*
-- Remain this code for better performance check
const lineToFile = (line, db) => {
	const [ dir, file, offset ] = getSmallMemoryFile(line, db)
	return new Promise((resolve, reject) => {
		// stream
//		fsSync.createReadStream(path.join(dir, file), {start: offset, end: offset + db.recordSize - 1}, {highWaterMark: db.recordSize})
//			.on('data', resolve)
//			.on('error', reject)
		
	// fs.readFile
//		fs.readFile(path.join(dir, file)).then(buffer => resolve(buffer.subarray(offset, offset + db.recordSize))).catch(reject)

		// fs.open + fs.read
		fs.open(path.join(dir, file), 'r').then(fd => {
			const buffer = Buffer.alloc(db.recordSize)
			fd.read(buffer, 0, db.recordSize, offset).then(() => {
				fd.close().catch(reject)
				resolve(buffer)
			}).catch(reject)
		}).catch(reject)
	})
}
*/
const lineToFile = async (line, db) => {
	const [ dir, file, offset ] = getSmallMemoryFile(line, db)
	const fd = await fs.open(path.join(setting.fieldDir, dir, file), 'r')
	const buffer = Buffer.alloc(db.recordSize)
	await fd.read(buffer, 0, db.recordSize, offset)
	fd.close().catch(consoleWarn)
	return buffer
}

const setCityRecord = (buffer, geodata, offset) => {
	var locId
	if(setting.locFile){
		locId = buffer.readUInt32LE(offset)
		offset += 4
	}
	if(mainFieldHash.latitude){
		geodata.latitude = buffer.readInt32LE(offset) / 10000
		offset += 4
	}
	if(mainFieldHash.longitude){
		geodata.longitude = buffer.readInt32LE(offset) / 10000
		offset += 4
	}
	if(mainFieldHash.postcode){
		var postcode2 = buffer.readUInt32LE(offset)
		var postcode1 = buffer.readInt8(offset + 4)
		if (postcode2) {
			var postcode, tmp
			if(postcode1 < -9){
				tmp = (-postcode1).toString()
				postcode = postcode2.toString(36)
				postcode = getZeroFill(postcode.slice(0, -tmp[1]), tmp[0]-0) + '-' + getZeroFill(postcode.slice(-tmp[1]), tmp[1]-0)
			} else if(postcode1 < 0){
				postcode = getZeroFill(postcode2.toString(36), -postcode1)
			} else if(postcode1 < 10){
				postcode = getZeroFill(postcode2.toString(10), postcode1)
			} else if(postcode1 < 72){
				postcode1 = String(postcode1)
				postcode = getZeroFill(postcode2.toString(10), (postcode1[0]-0) + (postcode1[1]-0))
				postcode = postcode.slice(0, postcode1[0]-0) + '-' + postcode.slice(postcode1[0]-0)
			} else {
				postcode = postcode1.toString(36).slice(1) + postcode2.toString(36)
			}
			geodata.postcode = postcode.toUpperCase()
		}
		offset += 5
	}
	if(mainFieldHash.area){
		geodata.area = AreaJson[buffer.readUInt8(offset)]
		offset += 1
	}

	if(locId){
		var locOffset = (locId-1) * setting.locRecordSize
		if(locFieldHash.country){
			geodata.country = LocBuffer.toString('utf8', locOffset, locOffset += 2)
			if(locFieldHash.eu){
				geodata.eu = EuJson[geodata.country]
			}
		}
		if(locFieldHash.region1){
			var region1 = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(region1 > 0) geodata.region1 = num37ToStr(region1)
		}
		if(locFieldHash.region1_name){
			var region1_name = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(region1_name > 0) geodata.region1_name = Region1NameJson[region1_name]
		}
		if(locFieldHash.region2){
			var region2 = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(region2 > 0) geodata.region2 = num37ToStr(region2)
		}
		if(locFieldHash.region2_name){
			var region2_name = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(region2_name > 0) geodata.region2_name = Region2NameJson[region2_name]
		}
		if(locFieldHash.metro){
			var metro = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(metro > 0) geodata.metro = metro
		}
		if(locFieldHash.timezone){
			var timezone = LocBuffer.readUInt16LE(locOffset)
			locOffset += 2
			if(timezone > 0) geodata.timezone = TimezoneJson[timezone]
		}
		if(locFieldHash.city){
			var city = LocBuffer.readUInt32LE(locOffset)
			locOffset += 4
			if(city > 0){
				var start = city >>> 8
				geodata.city = CityNameBuffer.toString('utf8', start, start + (city & 255))
			}
		}
	}
	return setCountryInfo(geodata)
}
const setCountryInfo = (geodata) => {
	if(setting.addCountryInfo){
		var h = countries[geodata.country]
		geodata.country_name = h.name
		geodata.country_native = h.native
		geodata.continent = h.continent
		geodata.continent_name = continents[h.continent]
		geodata.capital = h.capital
		geodata.phone = h.phone
		geodata.currency = h.currency
		geodata.languages = h.languages
	}
	return geodata
}

await reload()
