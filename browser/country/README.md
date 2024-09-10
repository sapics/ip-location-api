# @iplookup/country [![NPM version](https://badge.fury.io/js/@iplookup/country)](https://badge.fury.io/js/@iplookup/country)

## Synopsis

```html
<script src="https://cdn.jsdelivr.net/npm/@iplookup/country/iplookup.min.js"></script>
<script type="text/javascript">
var ip = "207.97.227.239"
var location = await IpLookup(ip)
console.log(location) // {country: 'FR'}
</script>
```

If you need extra information about country, try to use [@iplookup/country-extra](https://github.com/sapics/ip-location-api/tree/main/browser/country-extra).


## License

Since each user download a partial database, we use the CC0 Licensed database [geo-whois-asn-country](https://github.com/sapics/ip-location-db/tree/main/geo-whois-asn-country) for ip to country mapping to avoid license problem.

The license for the software itself is published under MIT License by [sapics](https://github.com/sapics).