rem ---------------------
rem CITY
rem ---------------------
cd /d %~dp0

rem default configuration
node benchmark-this.js ila_fields=latitude,longitude,area,country,region1,metro,timezone,city

rem Run the benchmark for geoip-lite
node benchmark-other.cjs geoip-lite

rem small_memory configuration
node benchmark-this.js ila_small_memory=true ila_fields=latitude,longitude,area,country,region1,metro,timezone,city

rem Run the benchmark for fast-geoip
node benchmark-other.cjs
