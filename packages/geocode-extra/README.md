# @iplookup/geocode-extra

[![npm version](https://badge.fury.io/js/%40iplookup%2Fgeocode-extra.svg)](https://badge.fury.io/js/%40iplookup%2Fgeocode-extra)
[![Downloads](https://img.shields.io/npm/dm/%40iplookup%2Fgeocode-extra.svg)](https://www.npmjs.com/package/%40iplookup%2Fgeocode-extra)
[![Build](https://github.com/sapics/ip-location-api/actions/workflows/build.yml/badge.svg)](https://github.com/sapics/ip-location-api/actions/workflows/build.yml)

## Usage

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/geocode-extra/dist/index.min.js"></script>
<script type="text/javascript">
  async function run() {
    var ip = '207.97.227.239'
    var location = await IpLookup(ip)
    console.log(location)
    // {
    //   country: 'FR',
    //   latitude: 50.9959,
    //   longitude: 2.11757,
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

### ESM

```ts
import IpLookup from '@iplookup/geocode-extra'

const location = await IpLookup('207.97.227.239')
```

### CommonJS

```ts
const IpLookup = require('@iplookup/geocode-extra')

const location = await IpLookup('207.97.227.239')
```

If you do not need extra information about country, try to use [@iplookup/geocode](https://github.com/sapics/ip-location-api/tree/main/browser/geocode).

## License

The database for mapping ip to geocode is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) by [DB-IP](https://db-ip.com/db/download/ip-to-city-lite).

To get extra information about country, we use [Countries](https://github.com/annexare/Countries) which is published under MIT license by [Annexare Studio](https://annexare.com/).

The software itself is published under MIT license by [sapics](https://github.com/sapics).
