# ip-location-api

[![npm version](https://badge.fury.io/js/ip-location-api.svg)](https://badge.fury.io/js/ip-location-api)
[![Downloads](https://img.shields.io/npm/dm/ip-location-api.svg)](https://www.npmjs.com/package/ip-location-api)
[![Build](https://github.com/sapics/ip-location-api/actions/workflows/build.yml/badge.svg)](https://github.com/sapics/ip-location-api/actions/workflows/build.yml)

## Usage

```ts
import { clear, lookup, reload, update } from 'ip-location-api'

await reload({ fields: ['country'] })

const location = await lookup('8.8.8.8')
console.log(location) // { country: 'US' }

await update({ fields: ['country', 'city'] }) // Update the database from the remote source
await reload({ fields: ['country', 'city'] }) // Reload the in-memory database with the updated data

const location2 = await lookup('8.8.8.8')
console.log(location2) // { country: 'US', city: 'Mountain View' }

clear() // Clear the in-memory database

const location3 = await lookup('8.8.8.8')
console.log(location3) // null
```

## Configuration

You can configure the library in three ways:

- Environment variables: `ILA_FIELDS=country,city`
- CLI arguments: `node index.js ILA_FIELDS=country,city`
- Configuration object: `reload({ fields: ['country', 'city'] })`

| Option              | ENV Variable               | Default  | Description                                                                                                                           |
| ------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| fields              | ILA_FIELDS                 | country  | Specify which fields to retrieve from MaxMind. Use "all" to display all available fields.                                             |
| addCountryInfo      | ILA_ADD_COUNTRY_INFO       | false    | When set to "true", adds additional country information from the Countries database. Requires the "country" field to be selected.     |
| dataDir             | ILA_DATA_DIR               | ../data  | Directory path for the database file                                                                                                  |
| tmpDataDir          | ILA_TMP_DATA_DIR           | ../tmp   | Directory path for temporary files                                                                                                    |
| smallMemory         | ILA_SMALL_MEMORY           | false    | When true, operates in asynchronous mode. When false, operates in synchronous mode.                                                   |
| smallMemoryFileSize | ILA_SMALL_MEMORY_FILE_SIZE | 4096     | Maximum file size for asynchronous data processing (changing not recommended)                                                         |
| licenseKey          | ILA_LICENSE_KEY            | redist   | MaxMind license key for downloading the latest database. Set to "redist" to use the redistributed database from node-geolite2-redist. |
| series              | ILA_SERIES                 | GeoLite2 | Set to "GeoIP2" to use the premium GeoIP2 database                                                                                    |
| language            | ILA_LANGUAGE               | en       | Supported languages: "de", "en", "es", "fr", "ja", "pt-BR", "ru", "zh-CN". Affects the language of region and city names.             |
| silent              | ILA_SILENT                 | false    | When true, suppresses non-essential console output                                                                                    |

## Operating Modes

The library operates in two modes:

1. **Synchronous Mode** (default):

   - Loads all data into memory at startup
   - Higher memory usage
   - Slower startup time
   - Very fast lookups (>300x faster than async)

2. **Asynchronous Mode** (`smallMemory: true`):
   - Minimal memory footprint
   - Fast startup time
   - Slower lookups (loads data from disk as needed)

For optimal performance, use synchronous mode when sufficient memory is available.

## Available Fields

The library aims to maintain compatibility with `geoip-lite` field names where possible, while offering additional fields:

| Field Name     | geoip-lite | Source    | Description                                    |
| -------------- | ---------- | --------- | ---------------------------------------------- |
| country        | ✓          | MaxMind   | Two-letter country code (ISO-3166-1 alpha-2)   |
| region1        | region     | MaxMind   | First-level region code (ISO 3166-2)           |
| region1_name   | ✗          | MaxMind   | First-level region name (localized)            |
| region2        | ✗          | MaxMind   | Second-level region code (ISO 3166-2)          |
| region2_name   | ✗          | MaxMind   | Second-level region name (localized)           |
| city           | ✓          | MaxMind   | City name (localized)                          |
| metro          | ✓          | MaxMind   | Google Geolocation target code                 |
| eu             | ✓          | MaxMind   | EU membership flag (true for EU member states) |
| timezone       | ✓          | MaxMind   | Time zone identifier                           |
| latitude       | ll[0]      | MaxMind   | WGS84 latitude                                 |
| longitude      | ll[1]      | MaxMind   | WGS84 longitude                                |
| area           | ✓          | MaxMind   | Accuracy radius in kilometers                  |
| postcode       | ✗          | MaxMind   | Postal code                                    |
| country_name   | ✗          | Countries | Country name in English                        |
| country_native | ✗          | Countries | Country name in native language                |
| continent      | ✗          | Countries | Continent code                                 |
| continent_name | ✗          | Countries | Continent name                                 |
| capital        | ✗          | Countries | Capital city name                              |
| phone          | ✗          | Countries | International calling code                     |
| currency       | ✗          | Countries | Common currencies                              |
| languages      | ✗          | Countries | Common languages                               |

## License and Terms of Use

This project includes multiple components with different licenses:

1. **Software Library**: MIT License (© sapics)

2. **GeoLite2 Database**: CC BY-SA 4.0 (© MaxMind)

   - Usage restrictions:
     - No FCRA-regulated uses
     - No identification of specific households/individuals
     - Must allow database updates
     - Attribution to MaxMind required

   [View full GeoLite2 EULA](https://www.maxmind.com/en/geolite2/eula)

3. **Countries Database**: MIT License (© Annexare Studio)
