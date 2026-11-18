import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'

/* Réservation des leçons de conduite par l'élève (CreneauxConduiteService côté serveur) :
   du lundi au samedi, matin 9 h-13 h et soir 15 h-18 h, créneaux d'une heure, 3 places par heure
   avec son moniteur et le véhicule de ce moniteur. 4 jours au plus par semaine, une heure par jour.
   Annulation possible jusqu'à la veille. */

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const h = t => `${parseInt(t, 10)}h`
const plage = c => `${h(c.debut)}-${h(c.fin)}`
const dateLongue = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const dateCourte = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '')

function Creneau({ c, bloque, onReserver, onAnnuler }) {
  const moi = !!c.leconId
  if (moi) return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center"
      style={{ background: '#dcfce7', border: '1.5px solid #4ade80', color: '#166534', minHeight: 64 }}>
      <span className="text-[13px] font-extrabold whitespace-nowrap">{plage(c)}</span>
      <span className="text-[11px] font-bold"><i className="bi bi-check-circle-fill me-1" />Réservé</span>
      {c.annulable && (
        <button type="button" onClick={onAnnuler} className="text-[11px] font-bold border-0 bg-transparent cursor-pointer underline p-0" style={{ color: '#b91c1c' }}>
          Annuler
        </button>
      )}
    </div>
  )
  const complet = c.places <= 0
  const off = c.passe || complet || bloque
  return (
    <button type="button" disabled={off} onClick={onReserver}
      className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-center border-0"
      style={{ minHeight: 64, cursor: off ? 'default' : 'pointer',
        background: off ? '#f1f5f9' : '#fff', color: off ? '#94a3b8' : '#1e3a5f',
        boxShadow: off ? 'none' : 'inset 0 0 0 1.5px #cbd5e1' }}>
      <span className="text-[13px] font-extrabold whitespace-nowrap">{plage(c)}</span>
      <span className="text-[11px] font-bold" style={{ color: off ? '#94a3b8' : c.places === 1 ? '#c2410c' : '#15803d' }}>
        {c.passe ? 'Passé' : complet ? 'Complet' : `${c.places} place${c.places > 1 ? 's' : ''}`}
      </span>
    </button>
  )
}

export default function CreneauxConduite({ onChange }) {
  const [semaine, setSemaine] = useState(null)   // lundi affiché (null : semaine en cours)
  const [p, setP] = useState(null)
  const [erreur, setErreur] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(() => {
    api('GET', `/eleve/creneaux${semaine ? `?semaine=${semaine}` : ''}`)
      .then(r => { setP(r); setErreur(false) }).catch(() => setErreur(true))
  }, [semaine])
  useEffect(() => { charger() }, [charger])

  if (erreur) return null
  if (!p) return null

  if (p.refus) return (
    <div className="rounded-2xl px-4 py-4 flex items-start gap-3" style={{ background: '#fff', border: '1px solid #eef2f7', boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}>
      <i className="bi bi-calendar2-x text-xl" style={{ color: '#94a3b8' }} />
      <div>
        <div className="font-extrabold text-[#1e3a5f]">Réserver mes leçons de conduite</div>
        <div className="text-sm text-slate-500">{p.refus}</div>
      </div>
    </div>
  )

  // Aucune semaine ouverte par l'auto-école : l'élève attend l'ouverture
  if (p.fermee) return (
    <div className="rounded-2xl px-4 py-4 flex items-start gap-3" style={{ background: '#fff', border: '1px solid #eef2f7', boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}>
      <i className="bi bi-lock-fill text-xl" style={{ color: '#94a3b8' }} />
      <div>
        <div className="font-extrabold text-[#1e3a5f]">Réserver mes leçons de conduite</div>
        <div className="text-sm text-slate-500">{p.fermee}</div>
      </div>
    </div>
  )

  const complet = p.joursReserves >= p.joursMax
  const reserver = async (jour, c) => {
    if (envoi) return
    if (!(await confirmer({ titre: 'Réserver ce créneau ?', icone: 'calendar2-check',
      message: `${dateLongue(jour.date)}, de ${h(c.debut)} à ${h(c.fin)}, avec ${p.moniteur?.prenom || 'votre moniteur'}.`,
      libelle: 'Réserver' }))) return
    setEnvoi(true)
    try {
      await api('POST', '/eleve/creneaux', { date: jour.date, heure: c.debut })
      toast('Créneau réservé')
      onChange?.()
    } catch (e) { toast(e.message || 'Réservation impossible', 'danger') }
    finally { setEnvoi(false); charger() }
  }
  const annuler = async (jour, c) => {
    if (!(await confirmer({ titre: 'Annuler cette réservation ?', ton: 'danger', libelle: 'Annuler la réservation', libelleRetour: 'Garder',
      message: `${dateLongue(jour.date)}, de ${h(c.debut)} à ${h(c.fin)}. La place sera libérée pour un autre élève.` }))) return
    try {
      await api('DELETE', `/eleve/creneaux/${c.leconId}`)
      toast('Réservation annulée')
      onChange?.()
    } catch (e) { toast(e.message || 'Annulation impossible', 'danger') }
    finally { charger() }
  }

  const v = p.vehicule
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
      {/* En-tête : moniteur, véhicule, jours réservés */}
      <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2c5282)', color: '#fff' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.15)' }}>
          <i className="bi bi-calendar2-plus-fill" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold">Réserver mes leçons de conduite</div>
          <div className="text-xs" style={{ color: '#cbd5e1' }}>
            Avec {p.moniteur ? `${p.moniteur.prenom} ${p.moniteur.nom}` : 'votre moniteur'}
            {v && ` · ${[v.marque, v.modele].filter(Boolean).join(' ')} ${v.immatriculation}`}
          </div>
        </div>
        </div>
        <span className="self-start sm:self-auto rounded-full px-3 py-1 text-xs font-extrabold whitespace-nowrap" style={{ background: complet ? '#fde68a' : 'rgba(255,255,255,.15)', color: complet ? '#92400e' : '#fff' }}>
          {p.joursReserves}/{p.joursMax} jours réservés
        </span>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Semaine en cours / suivante */}
        <div className="flex gap-1 p-1 w-full sm:w-fit" style={{ background: '#eef2f7', borderRadius: 999 }}>
          {p.semaines.map(s => (
            <button key={s} type="button" onClick={() => setSemaine(s)}
              className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-[13px] sm:text-sm font-extrabold border-0 cursor-pointer whitespace-nowrap"
              style={{ borderRadius: 999, ...(p.semaine === s ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>
              {s === p.semaineCourante ? 'Cette semaine' : 'Semaine prochaine'}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          <i className="bi bi-info-circle me-1" />Une heure par jour, matin ou soir, {p.joursMax} jours au plus par semaine. {p.placesParCreneau} élèves par heure : premier arrivé, premier servi. Annulation possible jusqu'à la veille.
        </div>

        {p.jours.map((jour, i) => {
          const finis = jour.creneaux.every(c => c.passe && !c.leconId)
          if (finis) return null
          // Jour déjà pris (une heure par jour) ou semaine complète : les autres heures sont bloquées
          const bloque = jour.dejaPris || complet
          return (
            <div key={jour.date} className="rounded-xl p-3" style={{ border: '1px solid #eef2f7', background: jour.dejaPris ? '#f0fdf4' : '#fafbfc' }}>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="font-extrabold text-[#1e3a5f]">{JOURS[i]} <span className="font-semibold text-slate-500">{dateCourte(jour.date)}</span></span>
                {jour.dejaPris && <span className="text-[11px] font-bold" style={{ color: '#15803d' }}>Leçon prévue ce jour</span>}
              </div>
              {['MATIN', 'SOIR'].map(per => (
                <div key={per} className="mb-2 last:mb-0">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    <i className={`bi bi-${per === 'MATIN' ? 'sunrise' : 'sunset'} me-1`} />{per === 'MATIN' ? 'Matin' : 'Soir'}
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    {jour.creneaux.filter(c => c.periode === per).map(c => (
                      <Creneau key={c.debut} c={c} bloque={bloque}
                        onReserver={() => reserver(jour, c)} onAnnuler={() => annuler(jour, c)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {p.jours.every(j => j.creneaux.every(c => c.passe && !c.leconId)) && (
          <div className="text-sm text-slate-500 text-center py-4">Plus aucun créneau cette semaine : réservez pour la semaine prochaine.</div>
        )}
      </div>
    </div>
  )
}
