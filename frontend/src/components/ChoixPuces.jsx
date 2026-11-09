import { useState } from 'react'
import { Recherche } from './ListeModerne'
import { correspond } from '../utils'

/* Choix par puces avec recherche (élèves, moniteur, véhicule) : toucher une ligne la coche,
   la retoucher la décoche. multiple : plusieurs choix, valeur = liste d'ids ; sinon un seul,
   valeur = id. items : { id, titre, sous, badge, mots } (mots : texte de recherche). */
export default function ChoixPuces({ items, valeur, onChoisir, multiple = false, unite = 'élève', placeholder = 'Rechercher…', hauteur = 220 }) {
  const [q, setQ] = useState('')
  const coches = multiple ? valeur.map(String) : valeur ? [String(valeur)] : []
  const choisi = items.find(e => coches.includes(String(e.id)))
  const liste = items.filter(e => correspond(e.mots, q))
  const basculer = id => {
    const actif = coches.includes(id)
    if (multiple) onChoisir(actif ? coches.filter(x => x !== id) : [...coches, id])
    else onChoisir(actif ? '' : id)
  }
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
      <div className="p-2 flex flex-wrap items-center gap-2" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        {items.length > 5 && <div className="flex-1 min-w-[160px] flex"><Recherche value={q} onChange={setQ} placeholder={placeholder} /></div>}
        <span className="text-xs font-bold px-2 py-1" style={{ color: coches.length ? '#15803d' : '#94a3b8' }}>
          {coches.length > 1 ? <><i className="bi bi-check-circle-fill me-1" />{coches.length} {unite}s cochés</>
            : choisi ? <><i className="bi bi-check-circle-fill me-1" />{choisi.titre}</> : `Aucun ${unite} coché`}
        </span>
      </div>
      <div style={{ maxHeight: hauteur, overflowY: 'auto' }}>
        {liste.length === 0 && <div className="px-3 py-3 text-sm text-slate-400">Aucun {unite} trouvé</div>}
        {liste.map(e => {
          const actif = coches.includes(String(e.id))
          return (
            <div key={e.id} role="checkbox" aria-checked={actif} tabIndex={0} onClick={() => basculer(String(e.id))}
              onKeyDown={ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); basculer(String(e.id)) } }}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer" style={{ borderBottom: '1px solid #f1f5f9', background: actif ? '#fffbeb' : '#fff' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ border: `2px solid ${actif ? '#d4a017' : '#cbd5e1'}`, background: actif ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#fff' }}>
                {actif && <i className="bi bi-check-lg" style={{ color: '#1e3a5f', fontSize: '.75rem' }} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate" style={{ color: '#1e3a5f' }}>{e.titre}</div>
                {e.sous && <div className="text-xs text-slate-400 truncate">{e.sous}</div>}
              </div>
              {e.badge && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#eef2f7', color: '#475569' }}>{e.badge}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
