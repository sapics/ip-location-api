# @iplookup/geocode

[![npm version](https://badge.fury.io/js/%40iplookup%2Fgeocode.svg)](https://badge.fury.io/js/%40iplookup%2Fgeocode)
[![Downloads](https://img.shields.io/npm/dm/%40iplookup%2Fgeocode.svg)](https://www.npmjs.com/package/%40iplookup%2Fgeocode)
[![Build](https://github.com/sapics/ip-location-api/actions/workflows/build.yml/badge.svg)](https://github.com/sapics/ip-location-api/actions/workflows/build.yml)

## Usage

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/geocode/dist/index.min.js"></script>
<script type="text/javascript">
  async function run() {
    var ip = '207.97.227.239'
    var location = await IpLookup(ip)
    console.log(location)
    // {
    //   country: 'FR',
    //   latitude: 50.9959,
    //   longitude: 2.11757
    // }
  }
</script>
```

### ESM

```ts
import IpLookup from '@iplookup/geocode'

const location = await IpLookup('207.97.227.239')
```

### CommonJS

```ts
const IpLookup = require('@iplookup/geocode')

const location = await IpLookup('207.97.227.239')
```

If you need extra information about country, try to use [@iplookup/geocode-extra](https://github.com/sapics/ip-location-api/tree/main/browser/geocode-extra).

## License

The database is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) by [DB-IP](https://db-ip.com/db/download/ip-to-city-lite).

The software itself is published under MIT license by [sapics](https://github.com/sapics).
