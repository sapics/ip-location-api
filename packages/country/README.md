# @iplookup/country

[![npm version](https://badge.fury.io/js/%40iplookup%2Fcountry.svg)](https://badge.fury.io/js/%40iplookup%2Fcountry)
[![Downloads](https://img.shields.io/npm/dm/%40iplookup%2Fcountry.svg)](https://www.npmjs.com/package/%40iplookup%2Fcountry)
[![Build](https://github.com/sapics/ip-location-api/actions/workflows/build.yml/badge.svg)](https://github.com/sapics/ip-location-api/actions/workflows/build.yml)

## Usage

### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/country/dist/index.min.js"></script>
<script type="text/javascript">
  async function run() {
    var ip = '207.97.227.239'
    var location = await IpLookup(ip)
    console.log(location)
    // {
    //   country: 'FR',
    // }
  }
</script>
```

### ESM

```ts
import IpLookup from '@iplookup/country'

const location = await IpLookup('207.97.227.239')
```

### CommonJS

```ts
const IpLookup = require('@iplookup/country')

const location = await IpLookup('207.97.227.239')
```

If you need extra information about country, try to use [@iplookup/country-extra](https://github.com/sapics/ip-location-api/tree/main/browser/country-extra).

## License

Since each user download a partial database, we use the CC0 Licensed database [geo-whois-asn-country](https://github.com/sapics/ip-location-db/tree/main/geo-whois-asn-country) for ip to country mapping to avoid license problem.

The software itself is published under MIT License by [sapics](https://github.com/sapics).
