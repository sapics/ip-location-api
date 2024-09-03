rem ---------------------
rem COUNTRY
rem ---------------------
cd /d %~dp0

rem Run default configuration
node benchmark-this.js ila_data_type=country

rem Run small_memory configuration
node benchmark-this.js ila_data_type=country ila_small_memory=true
