# @iplookup/country-extra

[![npm version](https://badge.fury.io/js/%40iplookup%2Fcountry-extra.svg)](https://badge.fury.io/js/%40iplookup%2Fcountry-extra)
[![Downloads](https://img.shields.io/npm/dm/%40iplookup%2Fcountry-extra.svg)](https://www.npmjs.com/package/%40iplookup%2Fcountry-extra)
[![Build](https://github.com/sapics/ip-location-api/actions/workflows/build.yml/badge.svg)](https://github.com/sapics/ip-location-api/actions/workflows/build.yml)

## Usage

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/country-extra/dist/index.min.js"></script>
<script type="text/javascript">
  async function run() {
    var ip = '207.97.227.239'
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

### ESM

```ts
import IpLookup from '@iplookup/country-extra'

const location = await IpLookup('207.97.227.239')
```

### CommonJS

```ts
const IpLookup = require('@iplookup/country-extra')

const location = await IpLookup('207.97.227.239')
```

If you do not need extra information about country, try to use [@iplookup/country](https://github.com/sapics/ip-location-api/tree/main/browser/country).

## License

Since each user download a partial database, we use the CC0 Licensed database [geo-whois-asn-country](https://github.com/sapics/ip-location-db/tree/main/geo-whois-asn-country) for ip to country mapping to avoid license problem.

To get extra information about country, we use [Countries](https://github.com/annexare/Countries) which is published under MIT license by [Annexare Studio](https://annexare.com/).

The software itself is published under MIT license by [sapics](https://github.com/sapics).
