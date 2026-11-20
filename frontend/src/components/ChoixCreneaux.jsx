import { useState } from 'react'

/* « + Leçon » (conduite) : choix des séances dans la grille des créneaux de réservation, comme
   l'élève qui réserve : une semaine (lundi → samedi), des heures fixes d'une heure (9h–13h, 15h–19h), 3 places par
   créneau et par moniteur. Jusqu'à « max » séances dans la semaine, une seule par jour : choisir
   une autre heure le même jour remplace la première. */

const HEURES = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00']
const PLACES = 3
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const BLEU = '#1e3a5f'

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const versDate = s => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j) }
const lundiDe = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const plusJours = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const finCreneau = h => `${String(+h.slice(0, 2) + 1).padStart(2, '0')}:${h.slice(3, 5)}`
const court = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** valeur : [{ date: 'AAAA-MM-JJ', h: 'HH:MM' }] ; lecons : toutes les leçons connues (places prises) */
export default function ChoixCreneaux({ valeur, onChange, max = 3, moniteurId, lecons, ignorerId, nbEleves = 1, ouvertes = [], semaineDepart }) {
  const courant = lundiDe(new Date())
  // Semaine affichée : celle de la première séance choisie, sinon celle demandée, sinon la première ouverte à venir
  const [lundiIso, setLundiIso] = useState(() => {
    if (valeur[0]) return iso(lundiDe(versDate(valeur[0].date)))
    if (semaineDepart) return iso(lundiDe(versDate(semaineDepart)))
    return ouvertes.find(x => x >= iso(courant)) || iso(courant)
  })
  const lundi = versDate(lundiIso)
  const jours = JOURS.map((_, i) => plusJours(lundi, i))
  const maintenant = new Date()
  // Lignes : les heures de réservation, plus celle d'une séance choisie hors grille (ancienne leçon modifiée)
  const heures = [...new Set([...HEURES, ...valeur.filter(c => jours.some(j => iso(j) === c.date)).map(c => c.h)])].sort()

  const pris = (date, h) => lecons.filter(l => l.statut !== 'ANNULEE' && l.id !== ignorerId && String(l.moniteur?.id) === String(moniteurId)
    && l.date === date && l.heureDebut?.slice(0, 5) === h).length
  const passe = (date, h) => new Date(`${date}T${h}:00`) <= maintenant
  const choisi = (date, h) => valeur.some(c => c.date === date && c.h === h)
  const besoin = Math.max(1, nbEleves)

  const basculer = (date, h) => {
    if (choisi(date, h)) { onChange(valeur.filter(c => !(c.date === date && c.h === h))); return }
    const autres = valeur.filter(c => c.date !== date)            // une seule séance par jour
    if (max === 1) { onChange([{ date, h }]); return }
    if (autres.length >= max) return
    onChange([...autres, { date, h }].sort((a, b) => (a.date + a.h).localeCompare(b.date + b.h)))
  }

  const rang = Math.round((lundi - courant) / (7 * 864e5))       // 0 : semaine en cours
  const ouverte = ouvertes.includes(lundiIso)
  const fleche = { borderRadius: 999, background: '#f1f5f9', color: BLEU }

  if (!moniteurId) return (
    <div className="text-sm text-slate-500 flex items-center gap-2"><i className="bi bi-arrow-up-circle" />Choisissez d'abord le moniteur : la grille montre ses places libres.</div>
  )
  return (
    <div className="space-y-2.5">
      {/* Semaine : ‹ › (pas avant la semaine en cours) */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setLundiIso(iso(plusJours(lundi, -7)))} disabled={rang <= 0} aria-label="Semaine précédente"
          className="w-8 h-8 flex-shrink-0 border-0 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default" style={fleche}><i className="bi bi-chevron-left" /></button>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-sm font-extrabold" style={{ color: BLEU }}>Semaine du {court(lundi)} au {court(plusJours(lundi, 5))}</div>
          <div className="text-[11px] font-semibold" style={{ color: ouverte ? '#047857' : '#b45309' }}>
            <i className={`bi bi-${ouverte ? 'unlock-fill' : 'lock-fill'} me-1`} />{ouverte ? 'Ouverte aux réservations des élèves' : 'Pas encore ouverte aux réservations des élèves'}
          </div>
        </div>
        <button type="button" onClick={() => setLundiIso(iso(plusJours(lundi, 7)))} disabled={rang >= 8} aria-label="Semaine suivante"
          className="w-8 h-8 flex-shrink-0 border-0 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default" style={fleche}><i className="bi bi-chevron-right" /></button>
      </div>

      {/* Grille jours × heures : places libres du moniteur sur chaque créneau */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `58px repeat(6, minmax(0, 1fr))` }}>
        <div />
        {jours.map((j, i) => {
          const auj = iso(j) === iso(maintenant)
          const aSeance = valeur.some(c => c.date === iso(j))
          return (
            <div key={i} className="text-center leading-tight pb-0.5" style={{ borderBottom: `2px solid ${auj ? '#f0bb2a' : aSeance ? BLEU : '#eef2f7'}` }}>
              <div className="text-[11px] font-extrabold" style={{ color: BLEU }}>{JOURS[i]}</div>
              <div className="text-[10px] text-slate-400">{j.getDate()}</div>
            </div>
          )
        })}
        {heures.map(h => (
          <div key={h} className="contents">
            {h === '15:00' && <div className="col-span-full h-1" />}
            <div className="text-[11px] font-extrabold text-slate-500 flex items-center justify-end pe-1 whitespace-nowrap">{+h.slice(0, 2)}h–{+finCreneau(h).slice(0, 2)}h</div>
            {jours.map((j, i) => {
              const d = iso(j)
              const on = choisi(d, h)
              const libres = PLACES - pris(d, h)
              const hors = !HEURES.includes(h)
              const bloque = !on && (passe(d, h) || libres < besoin)
              const plein = !on && !passe(d, h) && libres < besoin
              const limite = !on && !bloque && max > 1 && valeur.length >= max && !valeur.some(c => c.date === d)
              return (
                <button key={i} type="button" onClick={() => basculer(d, h)} disabled={bloque || limite} aria-pressed={on}
                  title={on ? 'Séance choisie · cliquer pour l’enlever' : passe(d, h) ? 'Créneau passé' : plein ? 'Créneau complet' : limite ? `${max} séances au plus dans la semaine` : `${libres} place${libres > 1 ? 's' : ''} libre${libres > 1 ? 's' : ''}`}
                  className="h-9 min-w-0 flex items-center justify-center font-bold border-0 cursor-pointer disabled:cursor-default"
                  style={{
                    fontSize: 11.5, borderRadius: 8,
                    ...(on ? { background: BLEU, color: '#fff' }
                      : plein ? { background: '#fee2e2', color: '#b91c1c' }
                      : bloque ? { background: '#f8fafc', color: '#cbd5e1' }
                      : { background: hors ? '#fffbeb' : '#f0fdf4', color: limite ? '#cbd5e1' : '#047857', border: '1px solid #d1fae5' }),
                  }}>
                  {on ? <i className="bi bi-check-lg" /> : passe(d, h) ? '—' : plein ? 'complet' : <span>{libres}<span className="hidden sm:inline"> libre{libres > 1 ? 's' : ''}</span></span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Séances choisies */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-bold text-slate-500">{max > 1 ? `Séances choisies : ${valeur.length}/${max}` : 'Séance choisie :'}</span>
        {valeur.length === 0 && <span className="text-slate-400">cliquez un créneau libre{max > 1 ? ' (une séance par jour)' : ''}</span>}
        {valeur.map(c => (
          <button key={c.date + c.h} type="button" onClick={() => basculer(c.date, c.h)} title="Enlever"
            className="flex items-center gap-1 px-2 py-0.5 font-semibold border-0 cursor-pointer" style={{ fontSize: 11.5, borderRadius: 999, background: '#eff6ff', color: '#1d4ed8' }}>
            {versDate(c.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {+c.h.slice(0, 2)}h – {+finCreneau(c.h).slice(0, 2)}h
            <i className="bi bi-x" />
          </button>
        ))}
      </div>
    </div>
  )
}
