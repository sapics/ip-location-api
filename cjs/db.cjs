
const fs = require('fs/promises')
const fsSync = require('fs')
const path = require('path')
const { fileURLToPath } = require('url')
const { createHash } = require('crypto')
const { pipeline } = require('stream/promises';)

const axios = require('axios')
const { parse } = require('@fast-csv/parse')
const { Address4, Address6 } = require('ip-address')
const dayjs = require('dayjs')

const { setting } = require('./setting.cjs')
const { getPostcodeDatabase, strToNum37, aton4, aton6, getSmallMemoryFile, numberToDir, countryCodeToNum } = require('./utils.cjs')


const rimraf = (dir) => {
	if(fs.rm){
		return fs.rm(dir, {recursive: true, force: true, maxRetries: 3})
	}
	return fs.rmdir(dir, {recursive: true, maxRetries: 3})
}



const DownloadServer = 'https://download.maxmind.com/app/geoip_download'
const yauzl = require('yauzl')
const update = async () => {
	var srcList, refreshTmpDir = setting.downloadType !== 'reuse'
	if(refreshTmpDir || !fsSync.existsSync(setting.tmpDataDir)){

		await rimraf(setting.tmpDataDir)
		await fs.mkdir(setting.tmpDataDir, {recursive: true})
	}
	if (!fsSync.existsSync(setting.fieldDir)){
		await fs.mkdir(setting.fieldDir, {recursive: true})
	}

	console.log('Downloading database')
	if(setting.browserType === 'geocode'){
		await dbipLocation()
		return createBrowserIndex(setting.browserType)
	}

	if(setting.ipLocationDb){
		srcList = await ipLocationDb(setting.ipLocationDb.replace(/-country$/, ''))
	} else {
		srcList = await downloadZip()
	}

	if(!srcList){
		return console.log('ERROR TO UPDATE')
	}
	console.log(srcList);
	if(srcList === 'NO NEED TO UPDATE') {
		return;
	}

	console.log('Creating database for ip-location-api')
	await createData(srcList)
	console.log('Database update completed!!')

	if(refreshTmpDir){
		await rimraf(setting.tmpDataDir, {recursive: true, force: true})
	}
	if(SHA256_RESULT){

		await fs.writeFile(path.join(setting.fieldDir, setting.series + '-' + setting.dataType + '-CSV.zip.sha256'), SHA256_RESULT)
	}

	var tmpFiles = fsSync.readdirSync(setting.fieldDir).filter(file => file.endsWith('.tmp'))
	for(var tmpFile of tmpFiles){
		await fs.rename(path.join(setting.fieldDir, tmpFile), path.join(setting.fieldDir, tmpFile.replace('.tmp', '')))
	}
	if(setting.smallMemory && !setting.runningUpdate){
		await fs.cp(path.join(setting.fieldDir, 'v4-tmp'), path.join(setting.fieldDir, 'v4'), {recursive: true, force: true})
		await fs.cp(path.join(setting.fieldDir, 'v6-tmp'), path.join(setting.fieldDir, 'v6'), {recursive: true, force: true})
		rimraf(path.join(setting.fieldDir, 'v4-tmp')).catch(console.warn)
		rimraf(path.join(setting.fieldDir, 'v6-tmp')).catch(console.warn)
	}

	if(setting.browserType){
		await createBrowserIndex(setting.browserType)
	}

	console.log('SUCCESS TO UPDATE')
}

const ipLocationDb = async (db) => {
	var preUrl = 'https://cdn.jsdelivr.net/npm/@ip-location-db/'+db+'-country/'+db+'-country'
	var urls = [preUrl+'-ipv4.csv', preUrl+'-ipv6.csv'], fileNames = []
	for(var url of urls){
		fileNames.push(await _ipLocationDb(url))
	}
	return fileNames
}

const _ipLocationDb = async (url) => {
	var fileEnd = url.split('-').pop()
	return axios({
		method: 'get',
		url: url,
		responseType: 'stream'
	}).then(res => {
		return new Promise((resolve, reject) => {
			var fileName = setting.ipLocationDb + '-Blocks-' + fileEnd
			const ws = fsSync.createWriteStream(path.join(setting.tmpDataDir, fileName))
			ws.write('network1,network2,cc\n')
			res.data.pipe(ws)
			ws.on('finish', () => {
				resolve(fileName)
			})
			ws.on('error', reject)
		})
	})
}

const dbipLocation = async () => {
	const address = "https://download.db-ip.com/free/dbip-city-lite-" + dayjs().format('YYYY-MM') + ".csv.gz"
	const res = await fetch(address)
	const tmpFile = path.join(setting.tmpDataDir, 'dbip-city-lite.csv')
	const ws = fsSync.createWriteStream(tmpFile)
	await pipeline(res.body.pipeThrough(new DecompressionStream('gzip')), ws)
	return new Promise((resolve, reject) => {
		const v4 = [], v6 = []
		var preData
		fsSync.createReadStream(tmpFile).pipe(parse())
			.on('error', reject)
			.on('end', () => {
				var v4Buf1 = Buffer.alloc(v4.length * 4)
				var v4Buf2 = Buffer.alloc(v4.length * 4)
				var v4Buf3 = Buffer.alloc(v4.length * 8)
				for(var i = 0; i < v4.length; ++i){
					v4Buf1.writeUInt32LE(v4[i][0], i * 4)
					v4Buf2.writeUInt32LE(v4[i][1], i * 4)
					v4Buf3.writeInt32LE(v4[i][2], i * 8)
					v4Buf3.writeInt32LE(v4[i][3], i * 8 + 4)
				}
				fsSync.writeFileSync(path.join(setting.fieldDir, '4-1.dat'), v4Buf1)
				fsSync.writeFileSync(path.join(setting.fieldDir, '4-2.dat'), v4Buf2)
				fsSync.writeFileSync(path.join(setting.fieldDir, '4-3.dat'), v4Buf3)
		
				var v6Buf1 = Buffer.alloc(v6.length * 8)
				var v6Buf2 = Buffer.alloc(v6.length * 8)
				var v6Buf3 = Buffer.alloc(v6.length * 8)
				for(var i = 0; i < v6.length; ++i){
					v6Buf1.writeBigUInt64LE(v6[i][0], i * 8)
					v6Buf2.writeBigUInt64LE(v6[i][1], i * 8)
					v6Buf3.writeInt32LE(v6[i][2], i * 8)
					v6Buf3.writeInt32LE(v6[i][3], i * 8 + 4)
				}
				fsSync.writeFileSync(path.join(setting.fieldDir, '6-1.dat'), v6Buf1)
				fsSync.writeFileSync(path.join(setting.fieldDir, '6-2.dat'), v6Buf2)
				fsSync.writeFileSync(path.join(setting.fieldDir, '6-3.dat'), v6Buf3)
				resolve()
			})
			.on('data', arr => {
				if(!arr[2] || arr[3] === 'ZZ' || arr[3] === 'EU') return;
				var latitude = Math.round((parseFloat(arr[6])) * 10000) // -90 ~ 90 -> 10 ~ 190

				var longitude = Math.round((parseFloat(arr[7])) * 10000)// -180 ~ 180 -> 20 ~ 220

				var countryCodeNum = countryCodeToNum(arr[3]) // 0 ~ 675
				latitude = (latitude) << 10 | countryCodeNum
				if(arr[0].includes(':')){
					var start = aton6(arr[0])
					if(preData[1].constructor !== BigInt) preData = null
					if(preData && preData[1] + 1n === start && preData[2] === latitude && preData[3] === longitude){
						preData[1] = aton6(arr[1])
						return
					}
					v6.push(preData = [aton6(arr[0]), aton6(arr[1]), latitude, longitude])
				} else {
					var start = aton4(arr[0])
					if(preData && preData[1] + 1 === start && preData[2] === latitude && preData[3] === longitude){
						preData[1] = aton4(arr[1])
						return
					}
					v4.push(preData = [aton4(arr[0]), aton4(arr[1]), latitude, longitude])
				}
			})
	})
}

const createBrowserIndex = async (type) => {
	const exportDir = path.join(setting.fieldDir, type)
	await fs.rm(path.join(exportDir, '4'), {recursive: true, force: true})
	await fs.mkdir(path.join(exportDir, '4'), {recursive: true})
	await fs.rm(path.join(exportDir, '6'), {recursive: true, force: true})
	await fs.mkdir(path.join(exportDir, '6'), {recursive: true})

	const IndexSize = type === 'country' ? 1024 : 2048

	var startBuf = await fs.readFile(path.join(setting.fieldDir, '4-1.dat'))
	var startList = new Uint32Array(startBuf.buffer)
	var len = startList.length, indexList = new Uint32Array(IndexSize)
	var i, j, k
	var endBuf = await fs.readFile(path.join(setting.fieldDir, '4-2.dat'))
	var endList = new Uint32Array(endBuf.buffer)
	var dbInfo = await fs.readFile(path.join(setting.fieldDir, '4-3.dat'))
	var dbList =  type === 'country' ? new Uint16Array(dbInfo.buffer) : new Int32Array(dbInfo.buffer)
	var recordSize = setting.mainRecordSize + 8
	for(i = 0; i < IndexSize; ++i){
		var index = len * i / IndexSize | 0
		indexList[i] = startList[index]
		var nextIndex = len * (i + 1) / IndexSize | 0
		var count = nextIndex - index
		var exportBuf = Buffer.alloc(recordSize * count)
		for(j = index, k = 0; j < nextIndex; ++j){
			exportBuf.writeUInt32LE(startList[j], k * 4)
			exportBuf.writeUInt32LE(endList[j], 4 * count + k * 4)
			if(type === 'country'){
				exportBuf.writeUInt16LE(dbList[j], 8 * count + k * setting.mainRecordSize)
			} else {
				exportBuf.writeInt32LE(dbList[2*j],   8 * count + k * setting.mainRecordSize)
				exportBuf.writeInt32LE(dbList[2*j+1], 8 * count + k * setting.mainRecordSize + 4)
			}
			++k
		}
		await fs.writeFile(path.join(exportDir, '4', numberToDir(i)), exportBuf)
	}
	await fs.writeFile(path.join(exportDir, '4.idx'), Buffer.from(indexList.buffer))

	startBuf = await fs.readFile(path.join(setting.fieldDir, '6-1.dat'))
	startList = new BigUint64Array(startBuf.buffer)
	len = startList.length
	indexList = new BigUint64Array(IndexSize)
	endBuf = await fs.readFile(path.join(setting.fieldDir, '6-2.dat'))
	endList = new BigUint64Array(endBuf.buffer)
	dbInfo = await fs.readFile(path.join(setting.fieldDir, '6-3.dat'))
	dbList = type === 'country' ? new Uint16Array(dbInfo.buffer) : new Int32Array(dbInfo.buffer)
	recordSize = setting.mainRecordSize + 16
	for(i = 0; i < IndexSize; ++i){
		var index = len * i / IndexSize | 0
		indexList[i] = startList[index]
		var nextIndex = len * (i + 1) / IndexSize | 0
		var exportBuf = Buffer.alloc(recordSize * (nextIndex - index))
		var count = nextIndex - index
		for(j = index, k = 0; j < nextIndex; ++j){
			exportBuf.writeBigUInt64LE(startList[j], k * 8)
			exportBuf.writeBigUInt64LE(endList[j], 8 * count + k * 8)
			if(type === 'country'){
				exportBuf.writeUInt16LE(dbList[j], 16 * count + k * setting.mainRecordSize)
			} else {
				exportBuf.writeInt32LE(dbList[2*j],   16 * count + k * setting.mainRecordSize)
				exportBuf.writeInt32LE(dbList[2*j+1], 16 * count + k * setting.mainRecordSize + 4)
			}
			++k
		}
		await fs.writeFile(path.join(exportDir, '6', numberToDir(i)), exportBuf)
	}
	await fs.writeFile(path.join(exportDir, '6.idx'), Buffer.from(indexList.buffer))

	var exPath = path.join(__dirname, '..', 'browser', type)
	await fs.rm(path.join(exPath, '4'), {recursive: true, force: true})
	await fs.rm(path.join(exPath, '6'), {recursive: true, force: true})
	await fs.cp(exportDir, exPath, {recursive: true})
	exPath = path.join(__dirname, '..', 'browser', type + '-extra')
	await fs.rm(path.join(exPath, '4'), {recursive: true, force: true})
	await fs.rm(path.join(exPath, '6'), {recursive: true, force: true})
	await fs.cp(exportDir, exPath, {recursive: true})
	await fs.rm(exportDir, {recursive: true, force: true})
}

var SHA256_RESULT
const downloadZip = async () => {
	SHA256_RESULT = false
	var name = setting.dataType[0].toUpperCase() + setting.dataType.slice(1)
	const database = {
		type: setting.dataType,
		edition: setting.series + '-' + name + '-CSV',
		suffix: 'zip.sha256',
		src: [
			setting.series + '-' + name + '-Locations-en.csv',
			setting.series + '-' + name + '-Blocks-IPv4.csv',
			setting.series + '-' + name + '-Blocks-IPv6.csv'
		],
	}
	if(setting.language !== 'en' && setting.isCity){
		database.src.push(setting.series + '-' + name + '-Locations-' + setting.language + '.csv')
	}
	if(!setting.licenseKey) {
		return console.warn('Please set your license key')
	}
	var url = DownloadServer + '?edition_id=' + database.edition + '&suffix=' + database.suffix + "&license_key=" + setting.licenseKey
	if(setting.licenseKey === 'redist'){
		url = 'https://raw.githubusercontent.com/sapics/node-geolite2-redist/master/redist/'
		url += database.edition + '.' + database.suffix
	}
	var text = await axios.get(url)
	var reg = /\w{50,}/, r = reg.exec(text.data)
	if(!r) {
		return console.warn('Cannot download sha256')
	}
	var sha256 = r[0], data = ''
	try{
		data = await fs.readFile(path.join(setting.fieldDir, database.edition + '.zip.sha256'), 'utf8')
	}catch(e){
		data = ''
	}

	const zipPath = path.join(setting.tmpDataDir, database.edition + '.zip')
	if(data === sha256){
		if(fsSync.existsSync(zipPath)){
			const zipHash = await sha256Hash(zipPath)
			if(zipHash === sha256){
				if(!setting.multiDbDir) {
					if(setting.sameDbSetting) return 'NO NEED TO UPDATE'
					if(setting.language === 'en') return database.src
				}
			}
		} else if(!setting.multiDbDir){
			if(setting.sameDbSetting) return 'NO NEED TO UPDATE'
		}
	}

	SHA256_RESULT = sha256
	url = DownloadServer + '?edition_id=' + database.edition + '&suffix=' + database.suffix.replace('.sha256', '') + "&license_key=" + setting.licenseKey
	if(setting.licenseKey === 'redist'){
		url = 'https://raw.githubusercontent.com/sapics/node-geolite2-redist/master/redist/'
		url += database.edition + '.' + database.suffix.replace('.sha256', '')
	}
	return axios({
		method: 'get',
		url: url,
		responseType: 'stream'
	}).then(res => {
		const dest = fsSync.createWriteStream(zipPath)
		return new Promise((resolve, reject) => {
			console.log('Decompressing', database.edition + '.zip')
			res.data.pipe(dest)
			res.data.on('end', () => {
				yauzl.open(zipPath, {lazyEntries: true}, (err, zipfile) => {
					if(err) return reject(err)
					zipfile.readEntry()
					zipfile.on('entry', entry => {
						for(var src of database.src){
							if(!entry.fileName.endsWith(src)) continue;
							console.log('Extracting', entry.fileName)
							return (function(src){
								zipfile.openReadStream(entry, (err, readStream) => {
									if(err) return reject(err)
									readStream.pipe(fsSync.createWriteStream(path.join(setting.tmpDataDir, src)))
									readStream.on('end', () => {
										zipfile.readEntry()
									})
								})
							})(src)
						}
						zipfile.readEntry()
					})
					zipfile.on('end', () => resolve(database.src))
				})
			})
			res.data.on('error', reject)
		})
	})
}

const sha256Hash = async (file) => {
	return new Promise((resolve, reject) => {
		const stream = fsSync.createReadStream(file)
		const hash = createHash('sha256')
		hash.once('finish', () => resolve(hash.digest('hex')))
		stream.on('error', reject)
		stream.pipe(hash)
	})
}

const createData = async (src) => {
	var mapDatas = []
	var locationSrc = src.filter(file => file.includes('Locations'))
	locationSrc.sort((a,b) => {

		if(a.endsWith('-en.csv')) return -1
		if(b.endsWith('-en.csv')) return 1
	})
	for(var file of locationSrc){
		mapDatas.push(await getMapData(file))
	}
	if(setting.locFile){
		minifyMapData(mapDatas)
	}
	var blockSrc = src.filter(file => file.includes('Blocks'))
	mapDatas.push([])
	for(var file of blockSrc){
		await createMainData(file, mapDatas)
	}
	if(setting.locFile){
		await createMapData(mapDatas)
	}
}


const createSmallMemoryFile = (ws, ipv4, line, buffer2, buffer3) => {
	const [ _dir, file, offset ] = getSmallMemoryFile(line, ipv4 ? setting.v4 : setting.v6, true)
	if(offset === 0){
		const dir = path.join(setting.fieldDir, _dir)
		if(ws) ws.end()
		if(file === '_0' && !fsSync.existsSync(dir)){
			fsSync.mkdirSync(dir, {recursive: true})
		}
		if(setting.smallMemoryFileSize <= buffer2.length + buffer3.length){
			var buf = Buffer.alloc(buffer2.length + buffer3.length)
			buffer2.copy(buf)
			buffer3.copy(buf, buffer2.length)
			fsSync.writeFile(path.join(dir, file), buf, () => {})
			return
		}
		ws = fsSync.createWriteStream(path.join(dir, file))
	}
	ws.write(buffer2)
	ws.write(buffer3)
	return ws
}

const createMainData = async (file, mapDatas) => {
	var ipv4 = file.endsWith('v4.csv')
	var ipv = ipv4 ? 4 : 6
	var rs = fsSync.createReadStream(path.join(setting.tmpDataDir, file))
	var ws1 = fsSync.createWriteStream(path.join(setting.fieldDir, ipv + '-1.dat.tmp'), {highWaterMark: 1024*1024})
	if(!setting.smallMemory){
		var ws2 =	fsSync.createWriteStream(path.join(setting.fieldDir, ipv + '-2.dat.tmp'), {highWaterMark: 1024*1024})
		var ws3 = fsSync.createWriteStream(path.join(setting.fieldDir, ipv + '-3.dat.tmp'), {highWaterMark: 1024*1024})
	} else {
		var ws = null
		var dir = path.join(setting.fieldDir, 'v' + ipv + '-tmp')
		if(fsSync.existsSync(dir)){
			await fs.rm(dir, {recursive: true, force: true})
		}
	}

	var preBuffer1, preBuffer2, preBuffer3, preCC, preEnd
	var preLocId, preLatitude, preLongitude, preArea, prePostcode

	var preLocLocation
	var mapData0 = mapDatas[0], locIdList = mapDatas[mapDatas.length - 1]
	var lineCount = 0
	areaDatabase = {}, areaCount = 0
	
	return new Promise((resolve, reject) => {
		var checkCount = 0
		function check(){
			if(++checkCount === 3)resolve()
		}
		rs.pipe(parse({headers: true}))
			.on('error', reject)
			.on('data', row => {
				var cc, buffer1, buffer2, buffer3, addr, start, end
				if(setting.ipLocationDb){
					if(ipv4){
						start = aton4(row.network1)
						end = aton4(row.network2)
					} else {
						start = aton6(row.network1)
						end = aton6(row.network2)
					}
				} else {
					if(ipv4){
						addr = new Address4(row.network)
						start = aton4(addr.startAddress().correctForm())
						end = aton4(addr.endAddress().correctForm())
					} else {
						addr = new Address6(row.network)
						start = aton6(addr.startAddress().correctForm())
						end = aton6(addr.endAddress().correctForm())
					}
				}
				
				if(setting.isCountry){
					if(setting.ipLocationDb){
						cc = row.cc
					} else {
						cc = mapData0[row.geoname_id]
					}
					if(!cc || cc.length !== 2) {
						return;// console.warn('Invalid country code', cc, row.geoname_id)
					}
					if(cc === preCC && (ipv4 && preEnd + 1 === start || !ipv4 && preEnd + 1n === start)){
						if(ipv4){
							preBuffer2.writeUInt32LE(end)
						} else {
							preBuffer2.writeBigUInt64LE(end)
						}
					} else {
						if(ipv4){
							buffer1 = Buffer.allocUnsafe(4)
							buffer1.writeUInt32LE(start)
							buffer2 = Buffer.allocUnsafe(4)
							buffer2.writeUInt32LE(end)
						} else {
							buffer1 = Buffer.allocUnsafe(8)
							buffer1.writeBigUInt64LE(start)
							buffer2 = Buffer.allocUnsafe(8)
							buffer2.writeBigUInt64LE(end)
						}
						buffer3 = Buffer.allocUnsafe(2)
						buffer3.write(cc)
						if(preBuffer1){
							if(!ws1.write(preBuffer1)) rs.pause()
							if (setting.smallMemory) {
								ws = createSmallMemoryFile(ws, ipv4, lineCount++, preBuffer2, preBuffer3)
							} else {
								if(!ws2.write(preBuffer2)) rs.pause()
								if(!ws3.write(preBuffer3)) rs.pause()
							}
						}
						preCC = cc
						preBuffer1 = buffer1
						preBuffer2 = buffer2
						preBuffer3 = buffer3
					}
				} else {
					var locId = row.geoname_id
					var latitude = Math.round(row.latitude * 10000)
					var longitude = Math.round(row.longitude * 10000)
					var area = row.accuracy_radius
					var postcode = row.postal_code


					var locLocation = mapData0[locId] && mapData0[locId].counter

					var isSame = true;
					if(setting.mainFieldHash.latitude && preLatitude !== latitude) isSame = false
					if(setting.mainFieldHash.longitude && preLongitude !== longitude) isSame = false
					if(setting.mainFieldHash.area && preArea !== area) isSame = false
					if(setting.mainFieldHash.postcode && prePostcode !== postcode) isSame = false

					if( (locId === preLocId || locLocation > 0 && locLocation === preLocLocation || setting.noLocFile)
						 && isSame

						 && (ipv4 && preEnd + 1 === start || !ipv4 && preEnd + 1n === start)){
						if(ipv4){
							preBuffer2.writeUInt32LE(parseInt(end, 10))
						} else {
							preBuffer2.writeBigUInt64LE(end)
						}
					} else {
						if(!locId){
							return;





						}
						if(locId && !mapData0[locId]) {
							return console.warn('Invalid location id', locId)
						}
						if(locId){
							if(!mapData0[locId].counter){
								locIdList.push(locId)
								locLocation = mapData0[locId].counter = locIdList.length
							}
						}
						if(preBuffer1){
							if(!ws1.write(preBuffer1)) rs.pause()
							if(setting.smallMemory){
								ws = createSmallMemoryFile(ws, ipv4, lineCount++, preBuffer2, preBuffer3)
							} else {
								if(!ws2.write(preBuffer2)) rs.pause()
								if(!ws3.write(preBuffer3)) rs.pause()
							}
						}
						if(ipv4){
							buffer1 = Buffer.allocUnsafe(4)
							buffer1.writeUInt32LE(parseInt(start, 10))
							buffer2 = Buffer.allocUnsafe(4)
							buffer2.writeUInt32LE(parseInt(end, 10))
						} else {
							buffer1 = Buffer.allocUnsafe(8)
							buffer1.writeBigUInt64LE(start)
							buffer2 = Buffer.allocUnsafe(8)
							buffer2.writeBigUInt64LE(end)
						}

						buffer3 = Buffer.alloc(setting.mainRecordSize)

						var offset = 0
						if(setting.locFile){
							buffer3.writeUInt32LE(mapData0[locId].counter)
							offset += 4
						}
						if(setting.mainFieldHash.latitude) {
							buffer3.writeInt32LE(latitude, offset)
							offset += 4
						}
						if(setting.mainFieldHash.longitude) {
							buffer3.writeInt32LE(longitude, offset)
							offset += 4
						}
						if(setting.mainFieldHash.postcode) {
							var postcodeDb = getPostcodeDatabase(postcode)
							buffer3.writeUInt32LE(postcodeDb[1], offset)
							buffer3.writeInt8(postcodeDb[0], offset + 4)
							offset += 5
						}
						if(setting.mainFieldHash.area) {
							buffer3.writeUInt8(makeAreaDatabase(area), offset)
						}

						preLocLocation = locLocation
						preLocId = locId
						preLatitude = latitude
						preLongitude = longitude
						preArea = area

						prePostcode = postcode
						preBuffer1 = buffer1
						preBuffer2 = buffer2
						preBuffer3 = buffer3
					}
				}
				preEnd = end
			})
			.on('pause', () => {
				ws1.once('drain', () => rs.resume())
				if(!setting.smallMemory){
					ws2.once('drain', () => rs.resume())
					ws3.once('drain', () => rs.resume())
				}
			})
			.on('end', () => {
				if(setting.smallMemory){
					ws = createSmallMemoryFile(ws, ipv4, lineCount, preBuffer2, preBuffer3)
					if(ws) ws.end(check)
					else ++checkCount
					++checkCount
				} else {
					ws2.end(preBuffer2, check)
					ws3.end(preBuffer3, check)
				}
				ws1.end(preBuffer1, check)
			})
	})
}

const minifyMapData = (mapDatas) => {
	var mapData0 = mapDatas[0]
	if(setting.language !== 'en') {
		var mapData1 = mapDatas.splice(1, 1)[0]
		for(var locId in mapData0){
			if(mapData1 && mapData1[locId]){
				if(mapData1[locId].city_name)          mapData0[locId].city_name = mapData1[locId].city_name
				if(mapData1[locId].subdivision_1_name) mapData0[locId].subdivision_1_name = mapData1[locId].subdivision_1_name
				if(mapData1[locId].subdivision_2_name) mapData0[locId].subdivision_2_name = mapData1[locId].subdivision_2_name
			}
		}
	}

	var locIds = Object.keys(mapData0), locFields = Object.keys(setting.locFieldHash).filter(v => setting.locFieldHash[v])
	locIds.sort((a,b) => a-b)
	const hash = {
		country: 'country_iso_code',
		region1: 'subdivision_1_iso_code',
		region1_name: 'subdivision_1_name',
		region2: 'subdivision_2_iso_code',
		region2_name: 'subdivision_2_name',
		city: 'city_name',
		metro: 'metro_code',
		timezone: 'time_zone'
	}
	const ranking = {
		country: 8,
		region1: 7,
		region1_name: 6,
		region2: 4,
		region2_name: 3,
		city: 9,
		metro: 1,
		timezone: 5
	}
	locFields.sort((a,b) => { return ranking[b] - ranking[a]})
	var checkFields = locFields.map(v => hash[v])

	var best1 = checkFields.shift()
	var listHash = {}
	for(var locId of locIds){
		var data = mapData0[locId]
		if(!listHash[data[best1]]){
			listHash[data[best1]] = []
		}
		listHash[data[best1]].push(locId)
	}

	var i, j, len, dataI, dataJ, locIdJ, tmpLocIds
	for(var key in listHash){
		tmpLocIds = listHash[key]
		for(i = 0, len = tmpLocIds.length; i < len; ++i){
			dataI = mapData0[tmpLocIds[i]]
			loopj: for(j = i+1; j < len; ++j){
				dataJ = mapData0[locIdJ = tmpLocIds[j]]
				for(var field of checkFields){
					if(dataI[field] !== dataJ[field]){
						continue loopj
					}
				}
				mapData0[locIdJ] = dataI
				tmpLocIds.splice(j, 1)
				--j
				--len
			}
		}
	}
}

const createMapData = async (mapDatas) => {
	var locIdList = mapDatas.pop()
	var mapData0 = mapDatas[0]
	var ws1 = fsSync.createWriteStream(path.join(setting.fieldDir, 'location.dat.tmp'))
	var ws2 = fsSync.createWriteStream(path.join(setting.fieldDir, 'name.dat.tmp'))
	var cityHash = {}, euHash = {}
	sub1Database = {}, sub2Database = {}, timezoneDatabase = {}
	sub1Count = 0, sub2Count = 0, timezoneCount = 0

	for(var locId of locIdList){
		var data0 = mapData0[locId]
		
		var cc = data0.country_iso_code
		var region1 = data0.subdivision_1_iso_code
		var region2 = data0.subdivision_2_iso_code
		var timezone = data0.time_zone
		var metro = data0.metro_code

		var region1_name = data0.subdivision_1_name
		var region2_name = data0.subdivision_2_name
		var city = data0.city_name

		var offset = 0
		var b = Buffer.alloc(setting.locRecordSize)
		if(setting.locFieldHash.country){
			if(cc && cc.length === 2) {
				b.write(cc, offset); //country code [2 bytes]
				if(setting.locFieldHash.eu && data0.is_in_european_union == 1){
					euHash[cc] = true
				}
			}
			offset += 2
		}
		if(setting.locFieldHash.region1){
			if(region1)	b.writeUInt16LE(strToNum37(region1), offset)       // subdivision code [2 bytes]
			offset += 2
		}
		if(setting.locFieldHash.region1_name){
			if(region1_name)	b.writeUInt16LE(makeSub1Database(region1_name), offset)  // subdivision name index [2 bytes]
			offset += 2
		}
		if(setting.locFieldHash.region2){
			if(region2)	b.writeUInt16LE(strToNum37(region2), offset)       // subdivision code [2 bytes]
			offset += 2
		}
		if(setting.locFieldHash.region2_name){
			if(region2_name)  b.writeUInt16LE(makeSub2Database(region2_name), offset)  // subdivision name index [2 bytes]	
			offset += 2
		}
		if(setting.locFieldHash.metro){
			if(metro)   b.writeUInt16LE(metro, offset)                     // metro code [2 bytes]
			offset += 2
		}
		if(setting.locFieldHash.timezone){
			if(timezone) b.writeUInt16LE(makeTimezoneDatabase(timezone), offset)// timezone [2 byte]
			offset += 2
		}
		if(setting.locFieldHash.city){
			if(city){
				b.writeUInt32LE(inputBuffer(cityHash, ws2, city), offset)    // cityname index [4 bytes]
			}
		}
		ws1.write(b)
	}
	ws1.end()
	ws2.end()

	var hash = {
		region1_name: DatabaseToArray(sub1Database),
		region2_name: DatabaseToArray(sub2Database),
		timezone: DatabaseToArray(timezoneDatabase),
		area: DatabaseToArray(areaDatabase).map(v => parseInt(v, 10)||0),
		eu: euHash
	}
	if(!setting.locFieldHash.region1_name) delete hash.region1_name
	if(!setting.locFieldHash.region2_name) delete hash.region2_name
	if(!setting.locFieldHash.timezone) delete hash.timezone
	if(!setting.mainFieldHash.area) delete hash.area
	if(!setting.locFieldHash.eu) delete hash.eu
	if(Object.keys(hash).length > 0){
		await fs.writeFile(path.join(setting.fieldDir, 'sub.json.tmp'), JSON.stringify(hash))
	}
	sub1Database = sub2Database = timezoneDatabase = areaDatabase = null
	mapDatas.length = 0
}

const DatabaseToArray = (database) => {
	var arr = ['']
	for(var key in database){
		arr[database[key]] = key
	}
	return arr
}

const inputBuffer = (hash, dataFile, text) => {
	if(hash[text]) return hash[text]
	if(hash.__offsetBB === undefined) {
		var b = Buffer.alloc(1)
		dataFile.write(b)
		hash.__offsetBB = 1
	}
	var offset = hash.__offsetBB
	var b = Buffer.from(text)
	var n = b.length + (offset << 8)
	dataFile.write(b)
	hash.__offsetBB = offset + b.length
	return hash[text] = n
}

var sub1Database = {}, sub2Database = {}, timezoneDatabase = {}, areaDatabase = {}
var sub1Count = 0, sub2Count = 0, timezoneCount = 0, areaCount = 0
const makeSub1Database = (sub1) => {
	if(sub1Database[sub1]) return sub1Database[sub1]
	return sub1Database[sub1] = ++sub1Count
}
const makeSub2Database = (sub2) => {
	if(sub2Database[sub2]) return sub2Database[sub2]
	return sub2Database[sub2] = ++sub2Count
}
const makeTimezoneDatabase = (tz) => {
	if(timezoneDatabase[tz]) return timezoneDatabase[tz]
	return timezoneDatabase[tz] = ++timezoneCount
}
const makeAreaDatabase = (area) => {
	if(areaDatabase[area]) return areaDatabase[area]
	return areaDatabase[area] = ++areaCount
}

const getMapData = async (file) => {
	const rs = fsSync.createReadStream(path.join(setting.tmpDataDir, file))
	const result = {}
	return new Promise((resolve, reject) => {
		rs.pipe(parse({headers: true}))
			.on('error', reject)
			.on('data', row => {
				if(setting.isCountry){
					result[row.geoname_id] = row.country_iso_code
				} else {
					result[row.geoname_id] = row
				}
			})
			.on('end', () => resolve(result))
	})
}

module.exports={update:update}