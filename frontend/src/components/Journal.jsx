import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import { EnteteListe, BarreFiltres, Recherche, Filtre, FiltreDate, Reinitialiser, ListeVide, ListeChargement } from './ListeModerne'

/* Journal des actions (super admin et administrateurs). Le serveur ne renvoie à un administrateur
   que ses propres actions, celles du secrétariat et celles des élèves ; le super admin voit tout. */

const ROLES = {
  SUPER_ADMIN: { label: 'Super admin', fond: '#fef3c7', couleur: '#92400e' },
  ADMIN:       { label: 'Administrateur', fond: '#e0f2fe', couleur: '#075985' },
  SECRETAIRE:  { label: 'Secrétariat', fond: '#f3e8ff', couleur: '#6b21a8' },
  ELEVE:       { label: 'Élève', fond: '#dcfce7', couleur: '#166534' },
}

/* Icône et couleur d'après le libellé de l'action. */
function genre(action) {
  const a = action.toLowerCase()
  if (a.startsWith('connexion')) return { icone: 'box-arrow-in-right', couleur: '#475569', fond: '#f1f5f9' }
  if (a.startsWith('quiz') || a.startsWith('réponse') || a.startsWith('reprise')) return { icone: 'mortarboard-fill', couleur: '#7c3aed', fond: '#ede9fe' }
  if (a.startsWith('déclaration')) return { icone: 'phone-fill', couleur: '#0369a1', fond: '#e0f2fe' }
  if (a.includes('mot de passe faux') || a.startsWith('compte bloqué')) return { icone: 'shield-exclamation', couleur: '#b45309', fond: '#fef3c7' }
  if (a.startsWith('désactivation')) return { icone: 'pause-circle-fill', couleur: '#b45309', fond: '#fef3c7' }
  if (a.startsWith('réactivation')) return { icone: 'play-circle-fill', couleur: '#15803d', fond: '#dcfce7' }
  if (a.startsWith('suppression') || a.startsWith('refus') || a.startsWith('annulation'))
    return { icone: 'trash3-fill', couleur: '#b91c1c', fond: '#fee2e2' }
  if (a.startsWith('ajout') || a.startsWith('inscription') || a.startsWith('création') || a.startsWith('import') || a.startsWith('approbation') || a.startsWith('validation'))
    return { icone: 'plus-circle-fill', couleur: '#15803d', fond: '#dcfce7' }
  return { icone: 'pencil-fill', couleur: '#1d4ed8', fond: '#dbeafe' }
}

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function libelleJour(jour) {
  const auj = new Date(), hier = new Date(); hier.setDate(auj.getDate() - 1)
  if (jour === iso(auj)) return "Aujourd'hui"
  if (jour === iso(hier)) return 'Hier'
  const d = new Date(`${jour}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== auj.getFullYear() ? { year: 'numeric' } : {}) })
}

export default function Journal() {
  const { user } = useAuth()
  const superAdmin = user?.role === 'SUPER_ADMIN'
  const [donnees, setDonnees] = useState({ entrees: [], total: 0, taille: 30, cle: null })
  const [personnes, setPersonnes] = useState([])
  const [page, setPage] = useState(1)
  const [filtres, setFiltres] = useState({ q: '', role: '', utilisateur: '', du: '', au: '' })
  const [q, setQ] = useState('')   // recherche appliquée après une courte pause de frappe

  useEffect(() => { api('GET', '/journal/personnes').then(setPersonnes).catch(() => {}) }, [])
  useEffect(() => { const t = setTimeout(() => { setQ(filtres.q); setPage(1) }, 350); return () => clearTimeout(t) }, [filtres.q])
  // Paramètres de la page demandée ; « en chargement » tant que les données reçues sont d'une autre demande
  const p = new URLSearchParams({ page: String(page - 1) })
  if (q.trim()) p.set('q', q.trim())
  for (const k of ['role', 'utilisateur', 'du', 'au']) if (filtres[k]) p.set(k, filtres[k])
  const cle = p.toString()
  const chargement = donnees.cle !== cle
  useEffect(() => {
    api('GET', `/journal?${cle}`).then(d => setDonnees({ ...d, cle })).catch(e => { toast(e.message, 'danger'); setDonnees(x => ({ ...x, cle })) })
  }, [cle])

  const changer = (k, v) => { setFiltres(f => ({ ...f, [k]: v })); if (k !== 'q') setPage(1) }
  const actifs = Object.values(filtres).some(Boolean)

  const groupes = []
  for (const e of donnees.entrees) {
    const jour = e.date.slice(0, 10), g = groupes[groupes.length - 1]
    if (g && g.jour === jour) g.items.push(e); else groupes.push({ jour, items: [e] })
  }

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <BarreFiltres>
        <Recherche value={filtres.q} onChange={v => changer('q', v)} placeholder="Action, élève, personne…" />
        <Filtre icone="person" value={filtres.utilisateur} onChange={v => changer('utilisateur', v)}>
          <option value="">Toutes les personnes</option>
          {personnes.map(x => <option key={x.id} value={x.id}>{x.nom} · {ROLES[x.role]?.label || x.role}</option>)}
        </Filtre>
        <Filtre icone="shield" value={filtres.role} onChange={v => changer('role', v)}>
          <option value="">Tous les rôles</option>
          {(superAdmin ? ['SUPER_ADMIN', 'ADMIN', 'SECRETAIRE', 'ELEVE'] : ['ADMIN', 'SECRETAIRE', 'ELEVE']).map(r =>
            <option key={r} value={r}>{r === 'ADMIN' && !superAdmin ? 'Mes actions' : ROLES[r].label}</option>)}
        </Filtre>
        <FiltreDate libelle="Du" value={filtres.du} onChange={v => changer('du', v)} />
        <FiltreDate libelle="Au" value={filtres.au} onChange={v => changer('au', v)} />
        {actifs && <Reinitialiser onClick={() => { setFiltres({ q: '', role: '', utilisateur: '', du: '', au: '' }); setPage(1) }} />}
      </BarreFiltres>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="journal-text" titre="Journal des actions"
          sousTitre={superAdmin ? 'Toutes les actions des administrateurs, du secrétariat et des élèves' : 'Vos actions, celles du secrétariat et celles des élèves'}
          nombre={donnees.total} />
        {chargement && donnees.entrees.length === 0 ? <ListeChargement />
          : donnees.entrees.length === 0 ? <ListeVide texte={actifs ? 'Aucune action ne correspond aux filtres' : 'Aucune action enregistrée pour le moment'} icone="journal-text" />
          : groupes.map(g => (
            <div key={g.jour}>
              <div className="px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                style={{ background: '#eef2f7', color: '#475569', borderBottom: '1.5px solid #dbe2ec', borderLeft: '4px solid #d4a017' }}>
                <i className="bi bi-calendar3 me-2" />{libelleJour(g.jour)}
              </div>
              {g.items.map(e => {
                const gr = genre(e.action), ro = ROLES[e.role] || { label: e.role, fond: '#f1f5f9', couleur: '#475569' }
                return (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-3" style={{ borderBottom: '1px solid #eef2f7', opacity: chargement ? .6 : 1 }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: gr.fond, color: gr.couleur }}>
                      <i className={`bi bi-${gr.icone}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 leading-snug">{e.action}</div>
                      {e.cible && <div className="text-sm text-slate-600 break-words">{e.cible}</div>}
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-slate-600">{e.nom}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: ro.fond, color: ro.couleur, fontSize: '.68rem' }}>{ro.label}</span>
                        {e.ip && <span title="Adresse IP de connexion"><i className="bi bi-globe2 me-1" />{e.ip}</span>}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-500 whitespace-nowrap">{e.date.slice(11, 16)}</div>
                  </div>
                )
              })}
            </div>
          ))}
        <Pagination page={page} setPage={setPage} total={donnees.total} pageSize={donnees.taille} />
      </div>
    </div>
  )
}
