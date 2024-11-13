## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Build packages using `pnpm build`
- Build packages in watch mode using `pnpm build:watch` (will watch for changes and rebuild)
- Run interactive tests using `pnpm test:ui`

## 📦 Packages

- `ip-location-api`: Core package with full functionality
- `@iplookup/country`: Lightweight package for country lookups (Web-compatible)
- `@iplookup/country-extra`: Enhanced country data with additional information (Web-compatible)
- `@iplookup/geocode`: Basic geocoding functionality (Web-compatible)
- `@iplookup/geocode-extra`: Enhanced geocoding with additional location data (Web-compatible)
- `@iplookup/util`: Utility functions for updating the database (Private)

## 📝 Commit Convention

This repository follows [Conventional Commits](https://www.conventionalcommits.org/). All commit messages must be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```
