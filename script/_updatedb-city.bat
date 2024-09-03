
cd /d %~dp0

node updatedb.js ila_fields=latitude,longitude,area,country,region1,metro,timezone,city
node updatedb.js ila_fields=latitude,longitude,area,country,region1,metro,timezone,city ila_small_memory=true
