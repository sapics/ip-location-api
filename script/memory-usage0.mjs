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
