import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { getIcons } from '@iconify/utils'
import type { IconifyJSON } from '@iconify/types'
import { ICONS } from '../src/constants/icons.ts'
import { unique } from '../src/utils/array.ts'

const require = createRequire(import.meta.url)
const iconNames: string[] = Object.values(ICONS)
const prefixes = unique(iconNames.map((iconName) => iconName.split(':')[0]))

const collections = prefixes.map((prefix) => {
  const iconSet = JSON.parse(readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), 'utf8')) as IconifyJSON
  const names = iconNames.filter((iconName) => iconName.startsWith(`${prefix}:`)).map((iconName) => iconName.split(':')[1])
  const subset = getIcons(iconSet, names)
  if (!subset) throw new Error(`Ícones não encontrados em @iconify-json/${prefix}: ${names.join(', ')}`)
  return subset
})

writeFileSync(new URL('../src/constants/icon-data.json', import.meta.url), `${JSON.stringify(collections)}\n`)
console.log(`icon-data.json: ${iconNames.length} ícones de ${prefixes.length} coleções`)
