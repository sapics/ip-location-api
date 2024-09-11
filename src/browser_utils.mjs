//----------------------------
// COUNTRY: IndexLoop = 10
//----------------------------
// IPv4: 1172844 >> 2 = 293211 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*4 = 4096 bytes
// COUNTRY_FILE_SIZE = Math.ceil(293211 / IndexSize) * (4 + 4 + 2) = 2870 bytes
// IPv6: 1914064 >> 3 = 146605 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*8 = 8192 bytes
// COUNTRY_FILE_SIZE = Math.ceil(146605 / IndexSize) * (8 + 8 + 2) = 144 * 18 = 2592 bytes


//----------------------------
// LATITUDE + LONGITUDE:  IndexLoop = 11
//----------------------------
// IPv4: 6474072 >> 2 = 1,618,518 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*4 = 8192 bytes
// COUNTRY_FILE_SIZE = Math.ceil(1618518 / IndexSize) * (4 + 4 + 4 + 4) = 791 * 16 = 12656 bytes
// IPv6: 7621144 >> 3 = 952,643 ips
// INDEX_FILE_SIZE = (2^IndexLoop)*8 = 16384 bytes
// COUNTRY_FILE_SIZE = Math.ceil(952643 / IndexSize) * (8 + 8 + 4 + 4) = 466 * 24 = 11184 bytes


export const downloadBuffer = async (url) => {
	return fetch(url, {cache: 'no-cache'}).then(res => res.arrayBuffer())
}
