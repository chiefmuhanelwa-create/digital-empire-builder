/**
 * What the rate card charges, across objectives and engagement rates.
 * Run: npx tsx scripts/price-check.ts
 *
 * Exists because the objective-driven change alters real prices, and a pricing change
 * should be read as a table before it is believed.
 */
import { computeRateCard, NICHE_CPM } from '../src/lib/rate-card-engine'

const niche = Object.keys(NICHE_CPM)[0]
const base = {
  followers: 270_000, views: 24_000, interactions: 380,
  niche, contentType: 'reel_short' as any, platforms: ['instagram'] as any,
  addons: [] as any, scope: 'single' as any, budgetTier: 'standard' as any,
  includeProduction: false,
}
const money = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA')

console.log(`niche: ${niche}  ·  270k followers  ·  24k views\n`)
console.log('INTERACTIONS   ER      BAND          OBJECTIVE     CPM        CPE        CHARGED    ON')
for (const inter of [380, 1500, 5000, 12000]) {
  for (const obj of ['awareness', 'engagement', ''] as const) {
    const r: any = computeRateCard({ ...base, interactions: inter, objective: obj as any })
    console.log(
      `${String(inter).padStart(10)}  ${r.er.toFixed(2).padStart(5)}%  ${r.cpeTierData.label.padEnd(12)}  ` +
      `${(obj || '(none)').padEnd(12)}  ${money(r.price_cpm_final).padEnd(9)}  ${money(r.price_cpe_final).padEnd(9)}  ` +
      `${money(r.sponsorship).padEnd(9)}  ${r.pricedOn}`
    )
  }
  console.log()
}
