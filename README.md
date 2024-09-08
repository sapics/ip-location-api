# ip-location-api [![NPM version](https://badge.fury.io/js/ip-location-api.svg)](https://badge.fury.io/js/ip-location-api)

Fast and customizable nodejs api to get geolocation information from ip address.
`ip-location-api` make a fast lookup by using in-memory database.

I make a benchmark for making comparison with intel 12700 (2.1GHz), SSD, nodejs v20.
You can change the memory usage or lookup time, by customizing location information.

| benchmark | type | in-memory db | startup | lookup ipv4 | lookup ipv6 |
| ---- | ---- | ---- |  ---- | ---- | ---- |
| ip-location-api<br>(default) | country | 6.9 MB  | 3 ms  | 0.362 μs/ip | 0.708 μs/ip |
| ip-location-api<br>(async)   | country | 2.9 MB  | 2 ms  | 243 μs/ip   | 255 μs/ip   |
| ip-location-api              | city    | 62.9 MB | 14 ms | 0.751 μs/ip | 1.064 μs/ip |
| ip-location-api<br>(async)   | city    | 15.6 MB | 5 ms  | 267 μs/ip   | 271 μs/ip   |
| [geoip-lite](https://github.com/geoip-lite/node-geoip)                  | city    | 136 MB  | 54 ms | 1.616 μs/ip | 3.890 μs/ip |
| [fast-geoip](https://github.com/Doc999tor/fast-geoip)<br>(async)        | city    | 0MB     | 4 ms  | 1714 μs/ip  | cannot lookup |


## Synopsis

```javascript
import { lookup } from 'ip-location-api'
// or CJS format
// const { lookup } = require('ip-location-api')

var ip = "207.97.227.239"
var location = lookup(ip)
// If you use Asynchronouns version which is configured with smallMemory=true,
// var location = await lookup(ip)

console.log(location)
{
  country: 'FR',
  region1: 'NOR',
  region1_name: 'Normandy',
  region2: '27', 
  region2_name: 'Eure',
  city: 'Heudicourt',
  // metro: Defined only in US (Aug.2024)
  timezone: 'Europe/Paris',
  eu: 1,
  latitude: 49.3335,
  longitude: 1.6566,
  area: 5,
  postcode: 27860,
  country_name: 'France',
  country_native: 'France',
  phone: [ 33 ],
  continent: 'EU',
  capital: 'Paris',
  currency: [ 'EUR' ],
  languages: [ 'fr' ],
  continent_name: 'Europe'
}
```


## Installation

```bash
$ npm i ip-location-api
```


## API

ip-location-api has two modes which are synchronous and asynchronous.
Synchronouns one load all data in-memory at startup time, thus it makes fast lookup.
Asynchronouns one load smaller data in-memory at startup time, and the other data is loaded from the hard drive for each lookup.

| type | memory usage | startup | lookup |
| ---- | ---- | ---- |  ---- |
| Synchronouns  | Large | Slow | Fast |
| Asynchronouns | Small | Fast | Slow |

If you have a enough memory, I recommend to use synchronouns one because lookup is over 300 times faster than asynchronouns one.


### Field description

Note that as far as possible, the same field names as in `geoip-lite` are used, but some different field names are used.

| `ip-location-api` | `geoip-lite` |  database |description |
| ---- | ---- | ---- | ---- |
| country | country | MaxMind | "2 letter" country code defined at [ISO-3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1) |
| region1 | region | MaxMind | region code which is short code for region1_name [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) |
| region1_name  | ❌️ | MaxMind | first sub division name (multi language) |
| region2 | ❌️ | MaxMind | region code which is short code for region2_name [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) |
| region2_name  | ❌️ | MaxMind | second sub division name (multi language) |
| city    | city |MaxMind |  city name (multi language) |
| metro   | metro |MaxMind |  Geolocation target code from Google |
| eu      | eu | MaxMind | true: the member state of the European Union, undefined: for the other countries. This needs "country" field. |
| timezone  | timezone | MaxMind | time zone associated with location |
| latitude  | ll[0] | MaxMind |  approximate [WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System) latitude |
| longitude | ll[1] | MaxMind |  approximate [WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System) longitude |
| area      | area | MaxMind | The radius in kilometers around the specified location where the IP address is likely to be. [maxmind blog](https://blog.maxmind.com/2022/06/using-maxminds-accuracy-radius/) |
| postcode  | ❌️ | MaxMind | region-specific postal code near the IP address |
| ❌️       | range | MaxMind | We removes range information for optimization |
| country_name      | ❌️ | Countries| country name|
| country_native    | ❌️ | Countries| country name in native language|
| continent | ❌️ | Countries| continent short code|
| continent_name | ❌️ | Countries| continent name|
| capital   | ❌️ | Countries | capital name |
| phone     | ❌️ | Countries| international country calling codes |
| currency  | ❌️ | Countries | list of commonly used currencies |
| languages | ❌️ | Countries | list of commonly used languages |


### Setup the configuration

You can configure the api by 3 way
`ILA_FIELDS=latitude,longitude` in CLI parameter or
`ILA_FIELDS=latitude,longitude` as environment variables or
`await reload({fields: 'latitude,longitude'})`.
The name of CLI prameter and environment variables are same.

Conf key in `reload(conf)` is named with "LOWER CAMEL", CLI or ENV parameter is named with "SNAKE" with adding "ILA_" (come from Ip-Location-Api).

| `reload(conf)` | CLI or ENV | default | description |
| ---- | ---- | ---- | ---- |
| fields | ILA_FIELDS | country | You can change the fields to be retrived from [MaxMind](https://www.maxmind.com/). When you set "all", all fields are displayed. |
| addCountryInfo | ILA_ADD_COUNTRY_INFO | false | "true" make to add the country information from [Countries](https://github.com/annexare/Countries). This needs "country" field. |
| dataDir | ILA_DATA_DIR | ../data | Directory for database file |
| tmpDataDir | ILA_TMP_DATA_DIR | ../tmp | Directory for temporary file |
| smallMemory | ILA_SMALL_MEMORY | false | false: synchronouns, ture: asynchronouns |
| smallMemoryFileSize | ILA_SMALL_MEMORY_FILE_SIZE | 4096 | Max file size for asynchronouns data (no change is recommended) |
| licenseKey | ILA_LICENSE_KEY | redist | By setting [MaxMind](https://www.maxmind.com/) License key, you can download latest version of database from [MaxMind](https://www.maxmind.com/) server. By setting to "redist", you can download the database from [node-geolite2-redist](https://github.com/sapics/node-geolite2-redist) repository which re-distribute the GeoLite2 database. |
| ipLocationDb | ILA_IP_LOCATION_DB | | When you need only "country" field, you can use [ip-location-db](https://github.com/sapics/ip-location-db) data |
| downloadType | ILA_DOWNLOAD_TYPE | reuse | By setting to "false", "tmpDataDir" directory is deleted every update. "reuse" dose not delete "tmpDataDir" and re-use "tmpDataDir"'s database if the database file dose not update. |
| multiDbDir | ILA_MULTI_DB_DIR | false | If you use multiple "dataDir", please make this value to "true" |
| series | ILA_SERIES | GeoLite2 | By setting to "GeoIP2", you can use premium database "GeoIP2" |
| language | ILA_LANGUAGE | en | You can choose "de", "en", "es", "fr", "ja", "pt-BR", "ru", "zh-CN". By changing, the language of "region1_name", "region2_name", "city" fields are changed |


### Update database

You can update the database by two way.
First is `await updateDb()` which is the recommended one, because api's in-memory database is auto reloaded after database update.
Second is `watchDb()` and CLI command `npm run updatedb`.
The CLI command update the database and `watchDb` reload api's in-memory database by watching the database directory's change ("dataDir").

There are three database update way, "ILA_LICENSE_KEY=redist" or "ILA_LICENSE_KEY=YOUR_GEOLITE2_LICENSE_KEY" or "ILA_IP_LOCATION_DB=YOUR_CHOOSEN_DATABSE".

When you set "ILA_LICENSE_KEY=redist", you can download GeoLite2 database from redistribution repository [node-geolite2-redist](https://github.com/sapics/node-geolite2-redist).

YOUR_GEOLITE2_LICENSE_KEY should be replaced by a valid GeoLite2 license key. Please [follow instructions](https://dev.maxmind.com/geoip/geoip2/geolite2/) provided by MaxMind to obtain a license key.

You can "YOUR_CHOOSEN_DATABSE" from [ip-location-db](https://github.com/sapics/ip-location-db) with country type. For example, "geolite2-geo-whois-asn" is wider IP range country database which is equivalent to GeoLite2 database result for GeoLite2 country covered IP range and geo-whois-asn-country for the other IP range. 
The other example, "geo-whois-asn" is [CC0 licensed database](https://github.com/sapics/ip-location-db/tree/main/geo-asn-country), if you are unable to apply the GeoLite2 License.


## How to use with an example

When you need only geographic coordinates, please set "ILA_FIELDS=latitude,longitude".
You need to create a database for each configuration.
The database is created by following CLI

```bash
$ npm run updatedb ILA_FIELDS=latitude,longitude
```

or

```bash
$ ILA_FIELDS=latitude,longitude # set environment variable
$ npm run updatedb
```

or you can create database with 'create.js' which includes the following.

```javascript
await updateDb({fields:['latitude', 'longitude']})
```


The CLI command for using `app.js` which uses `ip-location-api` is necessary to start with following CLI parameter

```bash
$ node app.js ILA_FIELDS=latitude,longitude
```

or environment variable

```bash
$ ILA_FIELDS=latitude,longitude # set environment variable
$ node app.js
```

or you can write down configuration in `reload` function of app.js as

```javascript
await reload({fields:['latitude', 'longitude']})
// or await reload({fields:'latitude,longitude'})
```


If you need all the data in above field table, setting "fields=all" and "addCountryInfo=true" is the one.


| benchmark | in-memory db | startup | lookup ipv4 | lookup ipv6 |
| ---- | ---- | ---- |  ---- | ---- |
| longitude,latitude | 46.5 MB  | 10 ms  | 0.428 μs/ip | 0.776 μs/ip |
| all                | 76.4 MB  | 18 ms  | 1.054 μs/ip | 1.348 μs/ip |



## Node.js version

This library supports Node.js >= 14 for ESM and CJS.


## License and EULA

There are multiple licenses in this library, one for the software library, and the others for the datadata.
Please read the LICENSE and EULA files for details.

The license for the software itself is published under MIT License by [sapics](https://github.com/sapics).


The GeoLite2 database comes with certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
   - for FCRA purposes,
   - to identify specific households or individuals.

You can read [the latest version of GeoLite2 EULA](https://www.maxmind.com/en/geolite2/eula).
GeoLite2 database is provided under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) by [MaxMind](https://www.maxmind.com/), so, you must create attribusion to [MaxMind](https://www.maxmind.com/) for using GeoLite2 database.


The database of [Countries](https://github.com/annexare/Countries) is published under MIT license by [Annexare Studio](https://annexare.com/).

