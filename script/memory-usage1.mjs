function checkMemory(){
	if(global.gc){
		global.gc(true)
		console.log('Garbage collection done')
	}
	const used = process.memoryUsage()
	const messages = []
	for (let key in used) {
	  messages.push(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
	}
	console.log(new Date(), messages.join(', '))
}

console.log('Memory usage before loading library')
checkMemory()

import { reload } from '../src/main.js'
var timeStart = Date.now()
await reload()
var timeEnd = Date.now()
console.log('Library load time: %d ms', timeEnd - timeStart)

console.log('Memory usage after loading library')
checkMemory()

async function test(){
	return new Promise(function(resolve, reject){
		setTimeout(function(){
			checkMemory()
			resolve()
		}, 5000)
	})
}
async function run(){
	for(var i = 0; i < 10000; ++i){
		await test()
	}
}

run()