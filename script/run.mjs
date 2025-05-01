import {lookup} from '../src/main.mjs'

var testIps = ['5.62.92.0', '2a0a:b383::', '5.79.126.27']

const run = async() => {
	for(var ip of testIps){
		var r = await lookup(ip)
		console.log(ip, r)
	}
}

run()