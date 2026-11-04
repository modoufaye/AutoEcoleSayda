/* Indicatifs proposés : Sénégal d'abord, puis les pays de la diaspora et de la sous-région.
   Un numéro sénégalais reste enregistré sur 9 chiffres (identifiant de connexion historique) ;
   un numéro étranger l'est avec son indicatif, sans le 0 de tête (06 12… en France → 336 12…). */
export const INDICATIFS = [
  { code: '221', drapeau: '🇸🇳', pays: 'Sénégal' },
  { code: '33',  drapeau: '🇫🇷', pays: 'France' },
  { code: '49',  drapeau: '🇩🇪', pays: 'Allemagne' },
  { code: '39',  drapeau: '🇮🇹', pays: 'Italie' },
  { code: '34',  drapeau: '🇪🇸', pays: 'Espagne' },
  { code: '32',  drapeau: '🇧🇪', pays: 'Belgique' },
  { code: '41',  drapeau: '🇨🇭', pays: 'Suisse' },
  { code: '44',  drapeau: '🇬🇧', pays: 'Royaume-Uni' },
  { code: '1',   drapeau: '🇺🇸', pays: 'États-Unis / Canada' },
  { code: '212', drapeau: '🇲🇦', pays: 'Maroc' },
  { code: '220', drapeau: '🇬🇲', pays: 'Gambie' },
  { code: '222', drapeau: '🇲🇷', pays: 'Mauritanie' },
  { code: '223', drapeau: '🇲🇱', pays: 'Mali' },
  { code: '224', drapeau: '🇬🇳', pays: 'Guinée' },
  { code: '225', drapeau: '🇨🇮', pays: "Côte d'Ivoire" },
  { code: '245', drapeau: '🇬🇼', pays: 'Guinée-Bissau' },
]

/** « 33680935269 » → ['33', '680935269'] ; 9 chiffres ou vide → Sénégal. */
export function decouperTelephone(valeur) {
  let n = String(valeur || '').replace(/\D/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (!n || n.length === 9) return ['221', n]
  if (n.startsWith('221') && n.length === 12) return ['221', n.slice(3)]
  const ind = INDICATIFS.filter(i => i.code !== '221' && n.startsWith(i.code) && n.length - i.code.length >= 6)
    .sort((a, b) => b.code.length - a.code.length)[0]
  return ind ? [ind.code, n.slice(ind.code.length)] : ['221', n]
}

/** Ce qui est enregistré : 9 chiffres pour le Sénégal, sinon indicatif + numéro sans le 0 de tête. */
export function composerTelephone(indicatif, national) {
  const n = String(national || '').replace(/\D/g, '')
  if (!n) return ''
  return indicatif === '221' ? n : indicatif + n.replace(/^0+/, '')
}

/** Affichage : 9 chiffres tels quels, numéro étranger en « +33 680935269 ». */
export function afficherTelephone(valeur) {
  const [ind, nat] = decouperTelephone(valeur)
  return !nat ? '' : ind === '221' ? nat : `+${ind} ${nat}`
}
