import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

/* Planning des leçons de conduite, vue semaine (administration, secrétariat, moniteurs) : pour un
   moniteur, une grille jours × heures. Chaque heure est une case horizontale découpée en places
   (3 par créneau, comme les réservations des élèves) : le nom de chaque élève dans sa place,
   séparée des autres par un trait vertical, puis les places libres. Cliquer une place libre
   planifie une leçon à cette heure ; cliquer un élève ouvre sa leçon. */

const PLACES = 3
const HEURES = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00']   // créneaux de réservation
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const BLEU = '#1e3a5f'
const RESERVE = "Réservé par l'élève"

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const lundiDe = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const plusJours = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const versDate = s => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j) }
// « 12:00 » → « 12h – 13h » : chaque ligne de la grille dit l'heure de début et de fin du créneau (1 h)
const plage = h => {
  const [a, m] = h.split(':').map(Number), f = a * 60 + m + 60
  const txt = (x, y) => `${x}h${y ? String(y).padStart(2, '0') : ''}`
  return `${txt(a, m)} – ${txt(Math.floor(f / 60), f % 60)}`
}
const court = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const nomEntier = e => e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : 'Élève'

/* Une heure : case horizontale, une place par élève (séparées par un trait vertical) puis les libres */
function Case({ lecons, passe, large, onLibre, onLecon }) {
  const places = Math.max(PLACES, lecons.length)
  const trop = lecons.length > PLACES
  return (
    <div className={`flex ${large ? 'h-10' : 'h-12'} overflow-hidden`} style={{ borderRadius: 10, border: `1.5px solid ${trop ? '#fca5a5' : '#e2e8f0'}`, background: passe ? '#f8fafc' : '#fff', opacity: passe ? 0.75 : 1 }}>
      {Array.from({ length: places }, (_, k) => {
        const l = lecons[k]
        const separe = k > 0 ? { borderLeft: '1.5px solid #e2e8f0' } : {}
        if (l) {
          const eleve = l.observations === RESERVE
          const fini = l.statut === 'TERMINEE'
          return (
            <button key={k} type="button" onClick={() => onLecon(l)} disabled={l.statut !== 'PLANIFIEE'}
              title={`${nomEntier(l.eleve)} · ${l.heureDebut?.slice(0, 5)}–${l.heureFin?.slice(0, 5)}${l.vehicule ? ` · ${l.vehicule.marque} ${l.vehicule.modele}` : ''}${eleve ? ' · réservé par l’élève' : ' · planifié par l’auto-école'}${fini ? ' · terminée' : ''}`}
              className="flex-1 min-w-0 flex items-center justify-center gap-1 px-1 font-bold border-0 cursor-pointer disabled:cursor-default"
              style={{ ...separe, borderRadius: 0, background: trop && k >= PLACES ? '#fee2e2' : eleve ? '#ecfdf5' : '#eff6ff', color: eleve ? '#047857' : '#1d4ed8' }}>
              {fini && <i className="bi bi-check2-circle flex-shrink-0" />}
              {large ? <span className="truncate text-[13px]">{nomEntier(l.eleve)}</span> : (
                /* Grille : prénom puis nom, sur deux lignes, pour tenir dans la place */
                <span className="min-w-0 flex flex-col leading-tight text-center">
                  <span className="truncate text-[11.5px]">{l.eleve?.prenom || 'Élève'}</span>
                  <span className="truncate text-[10px] font-semibold opacity-80">{l.eleve?.nom || ''}</span>
                </span>
              )}
            </button>
          )
        }
        return (
          <button key={k} type="button" onClick={onLibre} disabled={passe}
            title={passe ? 'Créneau passé' : 'Place libre : planifier une leçon'}
            className="flex-1 min-w-0 flex items-center justify-center text-[11px] font-semibold border-0 cursor-pointer disabled:cursor-default group"
            style={{ ...separe, borderRadius: 0, background: 'transparent', color: '#cbd5e1' }}>
            {passe ? '—' : <><span className="group-hover:hidden">libre</span><i className="bi bi-plus-lg hidden group-hover:inline" style={{ color: BLEU }} /></>}
          </button>
        )
      })}
    </div>
  )
}

export default function PlanningSemaine({ lecons, version, moniteurTelephone, onPlanifier, onLecon }) {
  const [moniteurs, setMoniteurs] = useState(null)
  const [moniteurId, setMoniteurId] = useState(null)
  /* Seules les semaines ouvertes aux réservations (par l'administration ou le secrétariat) se
     parcourent : par défaut la semaine en cours si elle est ouverte, sinon la prochaine ouverte. */
  const [ouvertes, setOuvertes] = useState(null)
  useEffect(() => { api('GET', '/semaines-reservation/ouvertes').then(l => setOuvertes((l || []).map(String))).catch(() => setOuvertes([])) }, [version])
  const [lundiVu, setLundiVu] = useState(null)
  const courante = iso(lundiDe(new Date()))
  const defaut = ouvertes?.length ? (ouvertes.includes(courante) ? courante : ouvertes.find(x => x > courante) || ouvertes[ouvertes.length - 1]) : null
  const lundiIso = lundiVu && ouvertes?.includes(lundiVu) ? lundiVu : defaut
  const lundi = lundiIso ? versDate(lundiIso) : lundiDe(new Date())
  const rang = ouvertes && lundiIso ? ouvertes.indexOf(lundiIso) : -1
  const [jourTel, setJourTel] = useState(() => (new Date().getDay() + 6) % 7)   // téléphone : un jour à la fois
  useEffect(() => { api('GET', '/moniteurs/actifs').then(setMoniteurs).catch(() => setMoniteurs([])) }, [])
  // Moniteur connecté : son planning d'abord ; sinon le premier moniteur
  const choisi = moniteurId ?? moniteurs?.find(m => moniteurTelephone && m.telephone === moniteurTelephone)?.id ?? moniteurs?.[0]?.id ?? null

  const fin = plusJours(lundi, 7)
  const dansSemaine = l => l.statut !== 'ANNULEE' && l.type === 'CONDUITE' && l.date >= iso(lundi) && l.date < iso(fin)
  const semaine = useMemo(() => lecons.filter(dansSemaine), [lecons, lundi]) // eslint-disable-line react-hooks/exhaustive-deps
  const parMoniteur = useMemo(() => {
    const n = {}
    for (const l of semaine) if (l.moniteur?.id) n[l.moniteur.id] = (n[l.moniteur.id] || 0) + 1
    return n
  }, [semaine])
  const miennes = semaine.filter(l => l.moniteur?.id === choisi)

  // Heures : les créneaux habituels, plus celles d'une leçon planifiée en dehors
  const heures = [...new Set([...HEURES, ...miennes.map(l => l.heureDebut?.slice(0, 5))])].filter(Boolean).sort()
  const dimanche = miennes.some(l => l.date === iso(plusJours(lundi, 6)))
  const jours = Array.from({ length: dimanche ? 7 : 6 }, (_, i) => plusJours(lundi, i))
  const cellule = (jour, h) => miennes.filter(l => l.date === iso(jour) && l.heureDebut?.slice(0, 5) === h)
    .sort((a, b) => nomEntier(a.eleve).localeCompare(nomEntier(b.eleve)))
  const maintenant = new Date()
  const passe = (jour, h) => new Date(`${iso(jour)}T${h}:00`) <= maintenant
  const libresJour = jour => heures.filter(h => HEURES.includes(h) && !passe(jour, h)).reduce((s, h) => s + Math.max(0, PLACES - cellule(jour, h).length), 0)
  const elevesJour = jour => miennes.filter(l => l.date === iso(jour)).length
  const libresSemaine = jours.reduce((s, j) => s + libresJour(j), 0)
  const surCourante = lundiIso === courante
  const planifier = (jour, h) => onPlanifier({ date: iso(jour), heureDebut: h, heureFin: `${String(+h.slice(0, 2) + 1).padStart(2, '0')}:${h.slice(3)}`, moniteurId: String(choisi) })

  const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      {/* En-tête : semaine (précédente / suivante) */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f)', borderBottom: '3px solid #d4a017' }}>
        <i className="bi bi-calendar-week-fill text-xl" style={{ color: '#f0bb2a' }} />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-white">{lundiIso ? <>Semaine du {court(lundi)} au {court(plusJours(lundi, 5))}{surCourante && <span className="ms-2 text-[11px] font-bold px-2 py-0.5 align-middle" style={{ borderRadius: 999, background: '#f0bb2a', color: BLEU }}>en cours</span>}</> : 'Aucune semaine ouverte'}</div>
          <div className="text-xs" style={{ color: '#cbd5e1' }}>{miennes.length} leçon{miennes.length > 1 ? 's' : ''} · {libresSemaine} place{libresSemaine > 1 ? 's' : ''} libre{libresSemaine > 1 ? 's' : ''} à venir</div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Semaine ouverte précédente / suivante (les semaines fermées sont sautées) */}
          <button type="button" onClick={() => setLundiVu(ouvertes[rang - 1])} disabled={rang <= 0} aria-label="Semaine ouverte précédente" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default" style={{ borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff' }}><i className="bi bi-chevron-left" /></button>
          {ouvertes?.includes(courante) && !surCourante && <button type="button" onClick={() => setLundiVu(courante)} className="h-9 px-3 border-0 text-xs font-bold cursor-pointer" style={{ borderRadius: 999, background: '#f0bb2a', color: BLEU }}>Cette semaine</button>}
          <button type="button" onClick={() => setLundiVu(ouvertes[rang + 1])} disabled={rang < 0 || rang >= (ouvertes?.length || 0) - 1} aria-label="Semaine ouverte suivante" className="w-9 h-9 border-0 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default" style={{ borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff' }}><i className="bi bi-chevron-right" /></button>
        </div>
      </div>

      {ouvertes !== null && !ouvertes.length ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          <i className="bi bi-lock-fill text-2xl" style={{ color: '#94a3b8' }} />
          <div className="mt-2 font-bold" style={{ color: BLEU }}>Aucune semaine n'est encore ouverte aux réservations</div>
          <div className="mt-1">Ouvrez la semaine en cours ou la suivante dans « Réservations des élèves », au-dessus.</div>
        </div>
      ) : (
      <div className="p-4 space-y-4">
        {/* Moniteurs : un planning chacun */}
        <div className="flex flex-wrap gap-1.5">
          {moniteurs === null ? <span className="spinner-border spinner-border-sm text-secondary" />
            : moniteurs.length === 0 ? <span className="text-sm text-slate-400">Aucun moniteur actif</span>
            : moniteurs.map(m => (
              <button key={m.id} type="button" onClick={() => setMoniteurId(m.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold cursor-pointer"
                style={{ borderRadius: 999, border: `1.5px solid ${choisi === m.id ? BLEU : '#e2e8f0'}`, background: choisi === m.id ? BLEU : '#fff', color: choisi === m.id ? '#fff' : '#475569' }}>
                <i className="bi bi-person-badge" />{m.prenom} {m.nom}
                <span className="text-[11px] font-extrabold px-1.5" style={{ borderRadius: 999, background: choisi === m.id ? 'rgba(255,255,255,.2)' : '#f1f5f9' }}>{parMoniteur[m.id] || 0}</span>
              </button>
            ))}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span><span className="inline-block w-3 h-3 me-1 align-middle" style={{ borderRadius: 3, background: '#ecfdf5', border: '1px solid #a7f3d0' }} />Réservé par l'élève</span>
          <span><span className="inline-block w-3 h-3 me-1 align-middle" style={{ borderRadius: 3, background: '#eff6ff', border: '1px solid #bfdbfe' }} />Planifié par l'auto-école</span>
          <span><i className="bi bi-check2-circle me-1" />Terminée</span>
          <span>{PLACES} places par heure · cliquez une place libre pour planifier</span>
        </div>

        {choisi && (
          <>
            {/* Ordinateur : grille complète (heures en lignes, jours en colonnes) */}
            <div className="hidden lg:grid gap-x-2 gap-y-1.5" style={{ gridTemplateColumns: `88px repeat(${jours.length}, minmax(0, 1fr))` }}>
              <div />
              {jours.map((j, i) => {
                const auj = iso(j) === iso(maintenant)
                return (
                  <div key={i} className="text-center pb-1" style={{ borderBottom: `3px solid ${auj ? '#f0bb2a' : '#eef2f7'}` }}>
                    <div className="text-sm font-extrabold" style={{ color: BLEU }}>{JOURS[i]} <span className="font-semibold text-slate-400">{j.getDate()}</span></div>
                    <div className="text-[11px] text-slate-500">{elevesJour(j)} élève{elevesJour(j) > 1 ? 's' : ''} · {libresJour(j)} libre{libresJour(j) > 1 ? 's' : ''}</div>
                  </div>
                )
              })}
              {heures.map(h => (
                <div key={h} className="contents">
                  {h === '15:00' && <div className="col-span-full h-2" />}
                  <div className="text-xs font-extrabold text-slate-500 flex items-center justify-end pe-1 whitespace-nowrap">{plage(h)}</div>
                  {jours.map((j, i) => (
                    <Case key={i} lecons={cellule(j, h)} passe={passe(j, h)} onLibre={() => planifier(j, h)} onLecon={onLecon} />
                  ))}
                </div>
              ))}
            </div>

            {/* Téléphone et tablette : un jour à la fois, noms en entier */}
            <div className="lg:hidden space-y-3">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {jours.map((j, i) => (
                  <button key={i} type="button" onClick={() => setJourTel(i)} className="flex-shrink-0 flex flex-col items-center px-3 py-1.5 border-0 cursor-pointer"
                    style={{ borderRadius: 12, background: jourTel === i ? BLEU : '#f1f5f9', color: jourTel === i ? '#fff' : '#475569' }}>
                    <span className="text-xs font-extrabold">{JOURS[i].slice(0, 3)} {j.getDate()}</span>
                    <span className="text-[10px] opacity-80">{elevesJour(j)} élève{elevesJour(j) > 1 ? 's' : ''}</span>
                  </button>
                ))}
              </div>
              {jours[jourTel] && heures.map(h => (
                <div key={h} className="flex items-center gap-2">
                  <div className="w-[74px] flex-shrink-0 text-xs font-extrabold text-slate-500 text-right whitespace-nowrap">{plage(h)}</div>
                  <div className="flex-1 min-w-0">
                    <Case large lecons={cellule(jours[jourTel], h)} passe={passe(jours[jourTel], h)} onLibre={() => planifier(jours[jourTel], h)} onLecon={onLecon} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  )
}
