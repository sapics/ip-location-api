
import ip_lookup from './browser.mjs'

import { countries } from 'countries-list'

export default async(ip) => {
	const geodata = await ip_lookup(ip)
	if(geodata && countries[geodata.country]){
		const h = countries[geodata.country]
		geodata.country_name = h.name
		geodata.country_native = h.native
		geodata.continent = h.continent
		geodata.capital = h.capital
		geodata.phone = h.phone
		geodata.currency = h.currency
		geodata.languages = h.languages
	}
	return geodata
}
