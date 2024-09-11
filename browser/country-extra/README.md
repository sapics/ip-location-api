# @iplookup/country-extra [![NPM version](https://badge.fury.io/js/@iplookup/country-extra)](https://badge.fury.io/js/@iplookup/country-extra)

This is an API created to make [ip-location-api](https://github.com/sapics/ip-location-api) available for browsers.
The database itself is large at 7MB, so it is splitted into over 2000 pieces for fast downloading in a browser.


## Synopsis

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/country-extra/iplookup.min.js"></script>
<script type="text/javascript">
async function run(){
	var ip = "207.97.227.239"
	var location = await IpLookup(ip)
	console.log(location)
	// {
	//   country: 'FR',
	//   country_name: 'France',
	//   country_native: 'France',
	//   phone: [ 33 ],
	//   continent: 'EU',
	//   capital: 'Paris',
	//   currency: [ 'EUR' ],
	//   languages: [ 'fr' ],
	//   continent_name: 'Europe'
	// }
}
</script>
```

#### ESM

```javascript
import IpLookup from '@iplookup/country-extra'
await IpLookup("2402:b801:ea8b:23c0::")
```

#### CJS

```javascript
const IpLookup = require('@iplookup/country-extra')
await IpLookup("207.97.227.239")
```

If you do not need extra information about country, try to use [@iplookup/country](https://github.com/sapics/ip-location-api/tree/main/browser/country).


## License

Since each user download a partial database, we use the CC0 Licensed database [geo-whois-asn-country](https://github.com/sapics/ip-location-db/tree/main/geo-whois-asn-country) for ip to country mapping to avoid license problem.

To get extra information about country, we use [Countries](https://github.com/annexare/Countries) which is published under MIT license by [Annexare Studio](https://annexare.com/).

The license for the software itself is published under MIT License by [sapics](https://github.com/sapics).