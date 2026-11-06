import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import Pagination from './Pagination'
import { EnteteListe, BarreFiltres, Recherche, Filtre, FiltreDate, Reinitialiser, ListeVide, ListeChargement } from './ListeModerne'

/* Journal → Visites (super admin) : qui ouvre le site (accueil, connexion, inscription en ligne)
   et qui essaie de s'inscrire, avec l'adresse IP, l'appareil et le site d'où vient le visiteur.
   Gardé 90 jours par le serveur. */

const PAGES = { '/': 'Accueil du site', '/login': 'Page de connexion', '/inscription': 'Inscription en ligne' }

/* « Téléphone Android · Chrome », « iPhone · Safari », « Ordinateur Windows · Edge »… */
function appareil(ua = '') {
  const machine = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Téléphone Android' : 'Tablette Android')
    : /Windows/.test(ua) ? 'Ordinateur Windows' : /Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Ordinateur Linux' : 'Appareil inconnu'
  const nav = /bot|crawl|spider|curl|wget|python/i.test(ua) ? 'robot' : /WhatsApp/i.test(ua) ? 'aperçu WhatsApp' : /FBAN|FBAV|FB_IAB/.test(ua) ? 'Facebook'
    : /Instagram/.test(ua) ? 'Instagram' : /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : ''
  return nav ? `${machine} · ${nav}` : machine
}

/* Site d'origine lisible : « l.wl.co » → WhatsApp, « lm.facebook.com » → Facebook… */
function provenance(hote) {
  if (!hote) return null
  for (const [motif, nom] of [[/wl\.co|whatsapp|wa\.me/, 'WhatsApp'], [/facebook|fb\.com/, 'Facebook'], [/instagram/, 'Instagram'],
    [/tiktok/, 'TikTok'], [/google/, 'Google'], [/bing/, 'Bing'], [/t\.co$|twitter|x\.com/, 'X (Twitter)']])
    if (motif.test(hote)) return nom
  return hote
}

/* Icône et couleur d'une entrée : visite, inscription réussie, refusée, robot. */
function genre(v) {
  if (v.type === 'VISITE') return { icone: 'globe2', couleur: '#0369a1', fond: '#e0f2fe' }
  if (v.resultat?.startsWith('Demande envoyée')) return { icone: 'person-check-fill', couleur: '#15803d', fond: '#dcfce7' }
  if (v.resultat?.startsWith('Robot')) return { icone: 'robot', couleur: '#b91c1c', fond: '#fee2e2' }
  return { icone: 'person-exclamation', couleur: '#b45309', fond: '#fef3c7' }
}

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function libelleJour(jour) {
  const auj = new Date(), hier = new Date(); hier.setDate(auj.getDate() - 1)
  if (jour === iso(auj)) return "Aujourd'hui"
  if (jour === iso(hier)) return 'Hier'
  const d = new Date(`${jour}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== auj.getFullYear() ? { year: 'numeric' } : {}) })
}

function Chiffre({ icone, couleur, fond, valeur, libelle }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white rounded-2xl px-3 sm:px-4 py-3" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fond, color: couleur }}><i className={`bi bi-${icone}`} /></div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold leading-none" style={{ color: '#0f2240' }}>{valeur ?? '—'}</div>
        <div className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1 leading-tight">{libelle}</div>
      </div>
    </div>
  )
}

export default function JournalVisites() {
  const [donnees, setDonnees] = useState({ entrees: [], total: 0, taille: 30, cle: null, resume: {} })
  const [page, setPage] = useState(1)
  const [filtres, setFiltres] = useState({ q: '', type: '', du: '', au: '' })
  const [q, setQ] = useState('')

  useEffect(() => { const t = setTimeout(() => { setQ(filtres.q); setPage(1) }, 350); return () => clearTimeout(t) }, [filtres.q])
  const p = new URLSearchParams({ page: String(page - 1) })
  if (q.trim()) p.set('q', q.trim())
  for (const k of ['type', 'du', 'au']) if (filtres[k]) p.set(k, filtres[k])
  const cle = p.toString()
  const chargement = donnees.cle !== cle
  useEffect(() => {
    api('GET', `/journal/visites?${cle}`).then(d => setDonnees({ ...d, cle })).catch(e => { toast(e.message, 'danger'); setDonnees(x => ({ ...x, cle })) })
  }, [cle])

  const changer = (k, v) => { setFiltres(f => ({ ...f, [k]: v })); if (k !== 'q') setPage(1) }
  const actifs = Object.values(filtres).some(Boolean)
  const r = donnees.resume || {}

  const groupes = []
  for (const e of donnees.entrees) {
    const jour = e.date.slice(0, 10), g = groupes[groupes.length - 1]
    if (g && g.jour === jour) g.items.push(e); else groupes.push({ jour, items: [e] })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Chiffre icone="people-fill" couleur="#0369a1" fond="#e0f2fe" valeur={r.visiteursAujourdhui} libelle="Visiteurs aujourd'hui" />
        <Chiffre icone="calendar-week" couleur="#7c3aed" fond="#ede9fe" valeur={r.visiteursSemaine} libelle="Visiteurs sur 7 jours" />
        <Chiffre icone="pencil-square" couleur="#15803d" fond="#dcfce7" valeur={r.inscriptionsSemaine} libelle="Essais d'inscription sur 7 jours" />
      </div>

      <BarreFiltres>
        <Recherche value={filtres.q} onChange={v => changer('q', v)} placeholder="Adresse IP, nom, téléphone, provenance…" />
        <Filtre icone="funnel" value={filtres.type} onChange={v => changer('type', v)}>
          <option value="">Visites et inscriptions</option>
          <option value="VISITE">Pages ouvertes</option>
          <option value="INSCRIPTION">Essais d'inscription</option>
        </Filtre>
        <FiltreDate libelle="Du" value={filtres.du} onChange={v => changer('du', v)} />
        <FiltreDate libelle="Au" value={filtres.au} onChange={v => changer('au', v)} />
        {actifs && <Reinitialiser onClick={() => { setFiltres({ q: '', type: '', du: '', au: '' }); setPage(1) }} />}
      </BarreFiltres>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="globe2" titre="Visites du site"
          sousTitre="Pages publiques ouvertes et essais d'inscription en ligne · 90 derniers jours" nombre={donnees.total} />
        {chargement && donnees.entrees.length === 0 ? <ListeChargement />
          : donnees.entrees.length === 0 ? <ListeVide texte={actifs ? 'Aucune visite ne correspond aux filtres' : 'Aucune visite enregistrée pour le moment'} icone="globe2" />
          : groupes.map(g => (
            <div key={g.jour}>
              <div className="px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                style={{ background: '#eef2f7', color: '#475569', borderBottom: '1.5px solid #dbe2ec', borderLeft: '4px solid #d4a017' }}>
                <i className="bi bi-calendar3 me-2" />{libelleJour(g.jour)}
              </div>
              {g.items.map(v => {
                const gr = genre(v), origine = provenance(v.provenance)
                return (
                  <div key={v.id} className="flex items-start gap-3 px-5 py-3" style={{ borderBottom: '1px solid #eef2f7', opacity: chargement ? .6 : 1 }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: gr.fond, color: gr.couleur }}>
                      <i className={`bi bi-${gr.icone}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 leading-snug">
                        {v.type === 'VISITE' ? PAGES[v.page] || v.page : `Essai d'inscription${v.nom ? ` · ${v.nom}` : ''}`}
                      </div>
                      {v.type === 'INSCRIPTION' && (
                        <div className="text-sm text-slate-600 break-words">
                          {v.resultat}{v.telephone && <span className="text-slate-400"> · <i className="bi bi-telephone me-1" />{v.telephone}</span>}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold text-slate-600" title="Adresse IP"><i className="bi bi-hdd-network me-1" />{v.ip}</span>
                        <span title={v.navigateur || ''}><i className="bi bi-phone me-1" />{appareil(v.navigateur || '')}</span>
                        {origine && <span title={v.provenance}><i className="bi bi-box-arrow-in-right me-1" />depuis {origine}</span>}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-500 whitespace-nowrap">{v.date.slice(11, 16)}</div>
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
