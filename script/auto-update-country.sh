cd browser/country
RES1=`find data -name '*.idx' -size -1k 2>/dev/null`
if [ -z "$RES1" ]; then
	cd ../country-extra
	RES2=`find data -name '*.idx' -size -1k 2>/dev/null`
	if [ -z "$RES2" ]; then
		VERT=`node -p "var j=require('./package.json');j.version=j.version.split('.').slice(0,-1).join('.')+'.'+require('dayjs')().format('YYYYMMDD');require('fs').writeFileSync('./package.json',JSON.stringify(j,null,2));j.version;"`
		npm publish --provenance --access public
	fi

	cd ../country
	VERT=`node -p "var j=require('./package.json');j.version=j.version.split('.').slice(0,-1).join('.')+'.'+require('dayjs')().format('YYYYMMDD');require('fs').writeFileSync('./package.json',JSON.stringify(j,null,2));j.version;"`
	git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
	git config --local user.name "github-actions[bot]"
	git commit -a -m "v${VERT} auto update ip database"
	npm publish --provenance --access public
fi

