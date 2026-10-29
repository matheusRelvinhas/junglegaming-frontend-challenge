import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ARTWORKS = ['emerald-ape', 'golden-beat', 'ivory-baron', 'sage-nomad']
const WEBP_QUALITY = 82

for (const artwork of ARTWORKS) {
  const source = fileURLToPath(new URL(`../design/assets/${artwork}.png`, import.meta.url))
  const target = fileURLToPath(new URL(`../public/nfts/${artwork}.webp`, import.meta.url))
  const info = await sharp(source).webp({ quality: WEBP_QUALITY }).toFile(target)
  console.log(`${artwork}.webp: ${Math.round(info.size / 1024)} KB`)
}
