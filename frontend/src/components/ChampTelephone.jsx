import { useState } from 'react'
import { INDICATIFS, decouperTelephone, composerTelephone } from '../telephones'

/* Champ téléphone avec liste d'indicatifs. value / onChange : le numéro enregistré (voir telephones.js). */
export default function ChampTelephone({ value, onChange, className = '', placeholder }) {
  const [ind, setInd] = useState(() => decouperTelephone(value)[0])
  const [nat, setNat] = useState(() => decouperTelephone(value)[1])
  // Valeur changée de l'extérieur (fiche ouverte, formulaire vidé) : redécoupée pendant le rendu
  const [suivie, setSuivie] = useState(value)
  if (value !== suivie) {
    setSuivie(value)
    if (composerTelephone(ind, nat) !== (value || '')) { const [i, n] = decouperTelephone(value); setInd(i); setNat(n) }
  }
  const maj = (i, n) => { setInd(i); setNat(n); onChange(composerTelephone(i, n)) }
  return (
    <div className="flex">
      {/* Champ compact (drapeau + indicatif) ; la liste native, invisible par-dessus, donne les noms des pays */}
      <label className="relative flex items-center gap-1 px-2.5 text-sm font-semibold text-slate-600 border-2 border-r-0 border-slate-200 bg-slate-50 flex-shrink-0 cursor-pointer mb-0"
        style={{ borderRadius: '.75rem 0 0 .75rem', display: 'flex' }} title="Indicatif du pays">
        <span>{INDICATIFS.find(i => i.code === ind)?.drapeau}</span><span>+{ind}</span>
        <i className="bi bi-chevron-down" style={{ fontSize: '.65rem' }} />
        <select value={ind} onChange={e => maj(e.target.value, nat)} title="Indicatif du pays" aria-label="Indicatif du pays"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          {INDICATIFS.map(i => <option key={i.code + i.pays} value={i.code}>{i.drapeau} +{i.code} · {i.pays}</option>)}
        </select>
      </label>
      <input type="tel" className={className} style={{ borderRadius: '0 .75rem .75rem 0' }}
        placeholder={placeholder || (ind === '221' ? '77 123 45 67' : 'Numéro sans l’indicatif')}
        value={nat} onChange={e => maj(ind, e.target.value)} />
    </div>
  )
}
