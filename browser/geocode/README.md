# @iplookup/geocode [![NPM version](https://badge.fury.io/js/@iplookup/geocode)](https://badge.fury.io/js/@iplookup/geocode)

This is an API created to make [ip-location-api](https://github.com/sapics/ip-location-api) available for browsers.
The database itself is large at 132MB, so it is splitted into over 4000 pieces for fast downloading in a browser.


## Synopsis

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/geocode/iplookup.min.js"></script>
<script type="text/javascript">
var ip = "51.210.219.22"
var location = await IpLookup(ip)
console.log(location)
// {
//   country: 'FR',
//   latitude: 50.9959,
//   longitude: 2.11757
// }
</script>
```

#### ESM

```javascript
import IpLookup from '@iplookup/geocode'
await IpLookup("2402:b801:ea8b:23c0::")
```

#### CJS

```javascript
const IpLookup = require('@iplookup/geocode')
await IpLookup("207.97.227.239")
```

If you need extra information about country, try to use [@iplookup/geocode-extra](https://github.com/sapics/ip-location-api/tree/main/browser/geocode-extra).


## License

The database is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) by [DB-IP](https://db-ip.com/db/download/ip-to-city-lite).

The software itself is published under MIT license by [sapics](https://github.com/sapics).