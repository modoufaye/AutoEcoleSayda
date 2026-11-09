import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { FenetreModerne, Etape } from './FenetreModerne'
import ChoixPuces from './ChoixPuces'
import { EnteteListe, BoutonRond } from './ListeModerne'
import { inscritCetteSemaine } from '../utils'
import { GROUPES, MODES, STATUTS, libelleSerie, serieDe, statutSerie } from '../contenu/seriesPubliees'

/* Travaux Dirigés : publication des annales et des séries d'examen pour des élèves, en
   entraînement et/ou en examen blanc (une publication par mode). Le super admin et les
   administrateurs publient pour tous les élèves, un moniteur pour les siens. */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const vignette = s => s?.titre.split(' ')[1] || '?'

/* Fenêtre « + Annales » / « + Série d'examen » ; edition : publication existante (seuls ses
   élèves changent). */
export function FenetrePublication({ genre, edition, onClose, onFini }) {
  const groupe = GROUPES.find(g => g.key === genre) || GROUPES[0]
  const [serie, setSerie] = useState(edition?.serie || groupe.series[0]?.id || '')
  const [modes, setModes] = useState(edition ? [edition.mode] : [])
  const [eleveIds, setEleveIds] = useState(edition ? edition.eleves.map(e => String(e.id)) : [])
  const [eleves, setEleves] = useState([])
  const [envoi, setEnvoi] = useState(false)
  useEffect(() => { api('GET', '/moniteur/seances/eleves').then(setEleves).catch(e => toast(e.message, 'danger')) }, [])

  const items = eleves.map(e => ({
    id: e.id, titre: e.nom, sous: e.telephone, mots: [e.nom, e.telephone],
    badge: e.admisCode ? 'Admis au code' : inscritCetteSemaine(e.dateInscription) ? 'NOUVEAU' : null,
  }))
  const basculerMode = m => { if (!edition) setModes(x => x.includes(m) ? x.filter(y => y !== m) : [...x, m]) }
  const s = serieDe(serie)

  const enregistrer = async () => {
    if (!serie) return toast(`Choisissez ${groupe.unite === 'série' ? 'une série' : 'un catalogue'}`, 'warning')
    if (!modes.length) return toast('Choisissez entraînement, examen blanc, ou les deux', 'warning')
    if (!eleveIds.length) return toast('Cochez au moins un élève', 'warning')
    setEnvoi(true)
    try {
      if (edition) await api('PUT', `/publications-series/${edition.id}`, { eleveIds })
      else await api('POST', '/publications-series', { serie, modes, eleveIds })
      toast(edition ? 'Publication modifiée' : 'Publié pour les élèves cochés')
      onFini()
    } catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(false) }
  }

  return (
    <FenetreModerne surTitre={`Travaux Dirigés · ${groupe.titre}`} titre={s ? s.titre : groupe.titre} icone="journal-bookmark-fill"
      details={[['check2-square', modes.map(m => MODES.find(x => x.key === m).libelle).join(' + ') || 'Mode à choisir'], ['people', `${eleveIds.length} élève${eleveIds.length > 1 ? 's' : ''}`]]}
      onClose={onClose} onSave={envoi ? () => {} : enregistrer} libelleSave={edition ? 'Enregistrer' : 'Publier'}
      piedGauche="Les élèves cochés le verront dans Travaux Dirigés">
      <Etape n={1} icon="journal-bookmark" titre={groupe.titre}>
        <div className="grid gap-2 sm:grid-cols-2">
          {groupe.series.map(x => {
            const on = serie === x.id
            return (
              <button key={x.id} type="button" disabled={!!edition && !on} onClick={() => !edition && setSerie(x.id)}
                className="flex items-center gap-3 p-2.5 text-left cursor-pointer" style={{ borderRadius: 14, border: `1.5px solid ${on ? '#d4a017' : '#e2e8f0'}`, background: on ? '#fffbeb' : '#fff', opacity: edition && !on ? .45 : 1 }}>
                <span className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-black text-white" style={{ borderRadius: 12, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>{vignette(x)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm" style={{ color: '#1e3a5f' }}>{x.titre}</span>
                  <span className="block text-xs text-slate-500 truncate">{x.sousTitre}</span>
                </span>
                {on && <i className="bi bi-check-circle-fill" style={{ color: '#d4a017' }} />}
              </button>
            )
          })}
        </div>
      </Etape>
      <Etape n={2} icon="ui-checks" titre={edition ? 'Mode' : 'Mode · un seul ou les deux'}>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => {
            const on = modes.includes(m.key)
            return (
              <button key={m.key} type="button" onClick={() => basculerMode(m.key)} disabled={!!edition && !on} aria-pressed={on}
                className="flex flex-col items-center gap-1 py-3 px-2 cursor-pointer" style={{ borderRadius: 14, border: `2px solid ${on ? m.couleur : '#e2e8f0'}`, background: on ? m.fond : '#fff', color: on ? m.couleur : '#64748b', opacity: edition && !on ? .45 : 1 }}>
                <i className={`bi bi-${on ? 'check-circle-fill' : m.icone}`} style={{ fontSize: '1.3rem' }} />
                <span className="text-sm font-extrabold">{m.libelle}</span>
                <span className="text-[11px] font-semibold text-center">{m.key === 'EXAMEN' ? 'Chronométré, note enregistrée' : 'Correction à chaque question'}</span>
              </button>
            )
          })}
        </div>
      </Etape>
      <Etape n={3} icon="people" titre="Élèves">
        <div className="flex flex-wrap gap-2 mb-2">
          <button type="button" onClick={() => setEleveIds(items.map(e => String(e.id)))} className="px-3 py-1.5 text-xs font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: '#eef2f7', color: '#1e3a5f' }}>Tout cocher</button>
          <button type="button" onClick={() => setEleveIds(items.filter(e => e.badge === 'NOUVEAU').map(e => String(e.id)))} className="px-3 py-1.5 text-xs font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: '#eef2f7', color: '#1e3a5f' }}>Nouveaux de la semaine</button>
          <button type="button" onClick={() => setEleveIds([])} className="px-3 py-1.5 text-xs font-bold border-0 cursor-pointer" style={{ borderRadius: 999, background: '#eef2f7', color: '#64748b' }}>Tout décocher</button>
        </div>
        <ChoixPuces items={items} valeur={eleveIds} onChoisir={setEleveIds} multiple placeholder="Nom ou téléphone…" hauteur={260} />
      </Etape>
    </FenetreModerne>
  )
}

const Statut = ({ k, n }) => {
  const s = STATUTS[k]
  return <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: s.fond, color: s.couleur }}><i className={`bi bi-${s.icone} me-1`} />{n != null ? `${n} ` : ''}{n != null ? s.libelle.toLowerCase() : s.libelle}</span>
}

/* Élèves d'une publication et leur résultat d'examen blanc à cette série (meilleure note, essais). */
function ResultatsEleves({ p }) {
  const ordre = { assimile: 0, revoir: 1, afaire: 2 }
  const eleves = [...p.eleves].sort((a, b) => ordre[statutSerie(a)] - ordre[statutSerie(b)] || a.nom.localeCompare(b.nom))
  return (
    <div className="px-4 sm:px-5 pb-3" style={{ background: '#f8fafc' }}>
      {p.mode === 'ENTRAINEMENT' && <div className="text-xs text-slate-500 pt-3"><i className="bi bi-info-circle me-1" />L’entraînement n’est pas noté : le résultat affiché est celui de l’examen blanc de cette série, si l’élève l’a passé.</div>}
      {eleves.map(e => (
        <div key={e.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #eef2f7' }}>
          <span className="flex-1 min-w-0 text-sm font-bold truncate" style={{ color: '#1e3a5f' }}>{e.nom}</span>
          {e.total ? <span className="text-xs text-slate-500 text-right whitespace-nowrap"><b className="text-sm" style={{ color: '#1e3a5f' }}>{e.meilleurScore}/{e.total}</b> · {e.tentatives} essai{e.tentatives > 1 ? 's' : ''}</span> : null}
          <Statut k={statutSerie(e)} />
        </div>
      ))}
    </div>
  )
}

/* Publications du personnel pour un onglet (annales ou séries d'examen) ; un clic sur une ligne
   montre qui l'a assimilée. */
export function ListePublications({ genre, publications, onModifier, onRecharger }) {
  const [ouverte, setOuverte] = useState(null)
  const ids = new Set((GROUPES.find(g => g.key === genre)?.series || []).map(s => s.id))
  const liste = (publications || []).filter(p => ids.has(p.serie))
  if (!liste.length) return null
  const supprimer = async p => {
    if (!(await confirmer({ titre: 'Retirer cette publication ?', ton: 'danger', icone: 'trash3-fill', libelle: 'Retirer',
      message: `« ${libelleSerie(p)} » ne sera plus proposé à ses ${p.eleves.length} élève(s). Leurs notes restent enregistrées.` }))) return
    try { await api('DELETE', `/publications-series/${p.id}`); toast('Publication retirée'); onRecharger() }
    catch (e) { toast(e.message, 'danger') }
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="send-check-fill" titre="Publié pour les élèves" sousTitre="Touchez une ligne pour voir qui a assimilé · objectif 20/25 en examen blanc" nombre={liste.length} />
      {liste.map(p => {
        const m = MODES.find(x => x.key === p.mode)
        const compte = k => p.eleves.filter(e => statutSerie(e) === k).length
        const ouvert = ouverte === p.id
        return (
          <div key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="px-4 sm:px-5 py-3 flex items-center gap-3 cursor-pointer" role="button" tabIndex={0} aria-expanded={ouvert}
            onClick={() => setOuverte(ouvert ? null : p.id)} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setOuverte(ouvert ? null : p.id) } }}
            style={{ background: ouvert ? '#f8fafc' : '#fff' }}>
            <span className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-black text-white" style={{ borderRadius: 12, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>{vignette(serieDe(p.serie))}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{serieDe(p.serie)?.titre || p.serie}</span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: m?.fond, color: m?.couleur }}><i className={`bi bi-${m?.icone} me-1`} />{m?.libelle}</span>
              </div>
              <div className="text-xs text-slate-500 truncate" title={p.eleves.map(e => e.nom).join(', ')}>
                <i className="bi bi-people me-1" />{p.eleves.length} élève{p.eleves.length > 1 ? 's' : ''}{p.auteur && ` · ${p.auteur}`} · {new Date(p.creeLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['assimile', 'revoir', 'afaire'].filter(k => compte(k)).map(k => <Statut key={k} k={k} n={compte(k)} />)}
              </div>
            </div>
            {p.modifiable && <div className="flex gap-2" onClick={ev => ev.stopPropagation()}>
              <BoutonRond title="Modifier les élèves" icon="pencil-fill" couleur="#1d4ed8" fond="#eff6ff" onClick={() => onModifier(p)} />
              <BoutonRond title="Retirer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimer(p)} />
            </div>}
            <i className={`bi bi-chevron-${ouvert ? 'up' : 'down'} text-slate-400`} />
          </div>
          {ouvert && <ResultatsEleves p={p} />}
          </div>
        )
      })}
    </div>
  )
}
