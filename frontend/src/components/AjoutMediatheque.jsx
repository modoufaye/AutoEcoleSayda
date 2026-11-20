import { useState } from 'react'
import { FenetreModerne } from './FenetreModerne'
import { correspond } from '../utils'

/* Séance de cours : ajouter d'un coup plusieurs vidéos et audios de la médiathèque. On filtre par
   type, langue et thème, on coche dans l'ordre voulu (le numéro affiché est l'ordre d'ajout) ;
   chaque média coché devient un bloc Vidéo ou Audio à la fin du contenu de la séance. */

const LANGUES = { FRANCAIS: { libelle: 'Français', couleur: '#1d4ed8', fond: '#dbeafe' }, WOLOF: { libelle: 'Wolof', couleur: '#047857', fond: '#d1fae5' } }
const BLEU = '#1e3a5f'
const pil = actif => ({ fontSize: 12.5, borderRadius: 999, minHeight: 32, border: `1.5px solid ${actif ? BLEU : '#e2e8f0'}`, background: actif ? BLEU : '#fff', color: actif ? '#fff' : '#475569' })

export default function AjoutMediatheque({ medias, dejaDansSeance = [], onAjouter, onFermer }) {
  const [type, setType] = useState('')
  const [langue, setLangue] = useState('')
  const [theme, setTheme] = useState('')
  const [q, setQ] = useState('')
  const [choix, setChoix] = useState([])   // ids, dans l'ordre où ils ont été cochés

  const themes = [...new Set(medias.map(m => m.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const visibles = medias.filter(m => (!type || m.type === type) && (!langue || m.langue === langue)
    && (!theme || (m.theme || '') === theme) && correspond([m.titre, m.theme, m.description], q))
  const basculer = id => setChoix(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])
  const tousCoches = visibles.length > 0 && visibles.every(m => choix.includes(m.id))
  const toutCocher = () => setChoix(c => tousCoches ? c.filter(id => !visibles.some(m => m.id === id)) : [...c, ...visibles.map(m => m.id).filter(id => !c.includes(id))])
  const choisis = choix.map(id => medias.find(m => m.id === id)).filter(Boolean)
  const nbV = choisis.filter(m => m.type === 'VIDEO').length, nbA = choisis.length - nbV

  return (
    <FenetreModerne surTitre="Contenu pédagogique" titre="Ajouter depuis la médiathèque" icone="collection-play-fill"
      details={[choisis.length > 0 && ['check2-square', [nbV && `${nbV} vidéo${nbV > 1 ? 's' : ''}`, nbA && `${nbA} audio${nbA > 1 ? 's' : ''}`].filter(Boolean).join(' · ')]]}
      piedGauche={choisis.length ? 'Un bloc par média, ajouté à la fin, dans l\'ordre coché' : 'Cochez un ou plusieurs médias'}
      libelleSave={choisis.length > 1 ? `Ajouter les ${choisis.length} médias` : 'Ajouter'}
      onClose={onFermer} onSave={() => { if (choisis.length) onAjouter(choisis) }}>
      <div className="space-y-3">
        {/* Filtres : type, langue, thème, recherche */}
        <div className="flex flex-wrap gap-1.5">
          {[['', 'Tout'], ['VIDEO', 'Vidéos'], ['AUDIO', 'Audios']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setType(v)} className="px-3 font-bold cursor-pointer" style={pil(type === v)}>{l}</button>
          ))}
          <span className="w-px mx-1 self-stretch" style={{ background: '#e2e8f0' }} />
          {[['', 'Toutes langues'], ['FRANCAIS', 'Français'], ['WOLOF', 'Wolof']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setLangue(v)} className="px-3 font-bold cursor-pointer" style={pil(langue === v)}>{l}</button>
          ))}
        </div>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
          <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)} aria-label="Thème">
            <option value="">Tous les thèmes</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="form-control" value={q} onChange={e => setQ(e.target.value)} placeholder="Titre, thème…" aria-label="Rechercher un média" />
        </div>

        {medias.length === 0 ? (
          <div className="text-sm text-slate-500 rounded-xl px-3 py-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            La médiathèque est vide : ajoutez d'abord des vidéos ou des audios dans la rubrique « Médiathèque ».
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
            <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="text-xs font-bold text-slate-500">{visibles.length} média{visibles.length > 1 ? 's' : ''}</span>
              {visibles.length > 0 && (
                <button type="button" onClick={toutCocher} className="text-xs font-bold bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#2563eb' }}>
                  {tousCoches ? 'Tout décocher' : 'Tout cocher'}
                </button>
              )}
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {visibles.length === 0 && <div className="px-3 py-4 text-sm text-slate-400">Aucun média ne correspond</div>}
              {visibles.map(m => {
                const rang = choix.indexOf(m.id), on = rang >= 0
                const l = LANGUES[m.langue] || LANGUES.FRANCAIS
                const deja = dejaDansSeance.includes(m.url)
                return (
                  <div key={m.id} role="checkbox" aria-checked={on} tabIndex={0} onClick={() => basculer(m.id)}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); basculer(m.id) } }}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer" style={{ borderBottom: '1px solid #f1f5f9', background: on ? '#fffbeb' : '#fff' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                      style={{ border: `2px solid ${on ? '#d4a017' : '#cbd5e1'}`, background: on ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#fff', color: BLEU }}>
                      {on ? rang + 1 : ''}
                    </div>
                    <i className={`bi bi-${m.type === 'VIDEO' ? 'camera-video-fill' : 'music-note-beamed'} flex-shrink-0`} style={{ color: m.type === 'VIDEO' ? '#dc2626' : '#9333ea' }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate" style={{ color: BLEU }}>{m.titre}</div>
                      <div className="text-xs text-slate-400 truncate">
                        <span className="font-bold px-1.5 rounded-full me-1" style={{ background: l.fond, color: l.couleur }}>{l.libelle}</span>
                        {m.theme && <span className="font-bold me-1" style={{ color: '#b45309' }}>{m.theme}</span>}
                        {deja && <span className="font-bold" style={{ color: '#7c3aed' }}>· déjà dans la séance</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </FenetreModerne>
  )
}
