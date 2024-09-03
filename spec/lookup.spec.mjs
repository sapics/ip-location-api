import { lookup } from '../src/main.mjs'

describe('lookup', () => {
	console.log('MJS lookup')
	it('lookup', ()  => {
		var ips = ['1.0.65.0', '2001:4860:b002::68', '2001:df3:e900::']
		var success = 0
		for(var ip of ips){
			var result = lookup(ip)
			console.log(ip, result)
			if(result) success++
		}
		expect(success > (ips.length >> 1)).toBe(true)
	})
	it('lookup v4map', () => {
		var ips = ['::ffff:2.29.0.82', '::ffff:3.24.1.56', '0:0:0:0:0:ffff:103.175.136.16']
		var success = 0
		for(var ip of ips){
			var result = lookup(ip)
			console.log(ip, result)
			if(result) success++
		}
		expect(success > (ips.length >> 1)).toBe(true)
	})
})


