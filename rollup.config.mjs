
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import ignore from 'rollup-plugin-ignore';
import replace from '@rollup/plugin-replace';

const original = {
  input: 'src/browser.mjs',
  output: {
    file: 'browser/country/iplookup.js',
    format: 'iife',
    name: 'IpLookup',
  },
  plugins: [
    {
      preventAssignment: true,
      "__CDNURL__": false,
      "__DATA_TYPE__": "'country'",
    },
    nodeResolve({
      browser: true,
    }),
    ignore(["fs", "path"]),
  ]
}
const settings = [original]

const DeepCopy = obj => {
  if(Array.isArray(obj)) {
    return obj.map(DeepCopy)
  } else if(obj.constructor === Object) {
    const newObj = {}
    for(const key in obj) {
      newObj[key] = DeepCopy(obj[key])
    }
    return newObj
  }
  return obj
}

settings[1] = DeepCopy(original)
settings[1].output.file = settings[1].output.file.replace('.js', '.min.js')
settings[1].plugins.push(terser())

settings[2] = DeepCopy(original)
settings[2].output.format = 'cjs'
settings[2].output.file = settings[2].output.file.replace('.js', '.cjs')
settings[2].plugins[0]["__CDNURL__"] = '"https://cdn.jsdelivr.net/npm/@iplookup/country/"'

settings[3] = DeepCopy(original)
settings[3].output.format = 'es'
settings[3].output.file = settings[3].output.file.replace('.js', '.mjs')
settings[3].plugins[0]["__CDNURL__"] = '"https://cdn.jsdelivr.net/npm/@iplookup/country/"'

settings.push(...settings.map(setting => {
  const newSetting = DeepCopy(setting)
  newSetting.output.file = newSetting.output.file.replace('country', 'geocode')
  newSetting.plugins[0]["__DATA_TYPE__"] = "'geocode'"
  return newSetting
}))

const extraSettings = settings.map(setting => {
  const extraSetting = DeepCopy(setting)
  extraSetting.input = extraSetting.input.replace('browser', 'browser-extra')
  extraSetting.output.file = extraSetting.output.file.replace('country', 'country-extra').replace('geocode', 'geocode-extra')
  return extraSetting
})

const exportSettings = settings.concat(extraSettings)
exportSettings.forEach(setting => {
//  console.log(setting.plugins[0])
  setting.plugins[0] = replace(setting.plugins[0])
})

export default exportSettings;
