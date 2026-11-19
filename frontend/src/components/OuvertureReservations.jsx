import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import EnvoiOuvertureReservations from './EnvoiOuvertureReservations'

/* Réservations de conduite des élèves, semaine par semaine : l'administration ou le secrétariat
   ouvre la semaine en cours ou la suivante après avoir vu les disponibilités des moniteurs (les
   élèves ne réservent que dans une semaine ouverte). Les moniteurs voient l'état, sans bouton. */

const jour = s => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j) }
const court = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const quand = s => new Date(s).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function OuvertureReservations({ peutOuvrir, onChange }) {
  const [semaines, setSemaines] = useState(null)
  const [envoi, setEnvoi] = useState(null)
  const [prevenir, setPrevenir] = useState(null)   // { lundi, periode } : envoi WhatsApp aux élèves
  useEffect(() => { api('GET', '/semaines-reservation').then(setSemaines).catch(() => setSemaines([])) }, [])
  if (!semaines?.length) return null

  const basculer = async s => {
    const lundi = jour(s.lundi), samedi = new Date(lundi); samedi.setDate(samedi.getDate() + 5)
    const periode = `du ${court(lundi)} au ${court(samedi)}`
    const ok = await confirmer(s.ouverte
      ? { titre: 'Fermer les réservations ?', ton: 'danger', libelle: 'Fermer', icone: 'lock-fill',
          message: `Semaine ${periode} : les élèves ne pourront plus réserver. Les leçons déjà réservées restent.` }
      : { titre: 'Ouvrir les réservations ?', libelle: 'Ouvrir', icone: 'unlock-fill',
          message: `Semaine ${periode} : les élèves pourront réserver leurs créneaux avec leur moniteur. Vérifiez d'abord les disponibilités des moniteurs.` })
    if (!ok) return
    setEnvoi(s.lundi)
    try {
      setSemaines(await api(s.ouverte ? 'DELETE' : 'POST', `/semaines-reservation/${s.lundi}`))
      toast(s.ouverte ? 'Réservations fermées' : 'Réservations ouvertes aux élèves')
      onChange?.()
      // Juste ouverte : on propose aussitôt de prévenir les élèves
      if (!s.ouverte) setPrevenir({ lundi: s.lundi, periode })
    } catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(null) }
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
      <div className="flex items-center gap-2 mb-2">
        <i className="bi bi-calendar2-plus-fill" style={{ color: '#d4a017' }} />
        <span className="text-sm font-extrabold" style={{ color: '#1e3a5f' }}>Réservations des élèves</span>
        <span className="text-xs text-slate-400 hidden sm:inline">· ouvertes semaine par semaine, après accord des moniteurs</span>
      </div>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
        {semaines.map(s => {
          const lundi = jour(s.lundi), samedi = new Date(lundi); samedi.setDate(samedi.getDate() + 5)
          return (
            <div key={s.lundi} className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 min-w-0" style={{ borderRadius: 14, background: s.ouverte ? '#ecfdf5' : '#f8fafc', border: `1.5px solid ${s.ouverte ? '#a7f3d0' : '#e2e8f0'}` }}>
              <i className={`bi bi-${s.ouverte ? 'unlock-fill' : 'lock-fill'} text-lg`} style={{ color: s.ouverte ? '#059669' : '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{s.courante ? 'Cette semaine' : 'Semaine prochaine'} <span className="font-semibold text-slate-500">· {court(lundi)} – {court(samedi)}</span></div>
                <div className="text-[11px] truncate" style={{ color: s.ouverte ? '#047857' : '#64748b' }}>
                  {s.ouverte ? `Ouverte${s.ouvertePar ? ` par ${s.ouvertePar}` : ''}${s.ouverteLe ? `, le ${quand(s.ouverteLe)}` : ''}` : 'Fermée : les élèves ne peuvent pas encore réserver'}
                </div>
              </div>
              {peutOuvrir && s.ouverte && (
                <button type="button" title="Prévenir les élèves par WhatsApp" onClick={() => setPrevenir({ lundi: s.lundi, periode: `du ${court(lundi)} au ${court(samedi)}` })}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-extrabold cursor-pointer flex items-center gap-1"
                  style={{ borderRadius: 999, border: 'none', background: '#25d366', color: '#fff' }}>
                  <i className="bi bi-whatsapp" /><span className="hidden sm:inline">Prévenir</span>
                </button>
              )}
              {peutOuvrir && (
                <button type="button" onClick={() => basculer(s)} disabled={envoi === s.lundi}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-extrabold cursor-pointer"
                  style={{ borderRadius: 999, border: s.ouverte ? '1.5px solid #fca5a5' : 'none', background: s.ouverte ? '#fff' : 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: s.ouverte ? '#b91c1c' : '#1e3a5f' }}>
                  {envoi === s.lundi ? <span className="spinner-border spinner-border-sm" /> : s.ouverte ? 'Fermer' : 'Ouvrir'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      {prevenir && <EnvoiOuvertureReservations lundi={prevenir.lundi} periode={prevenir.periode} onClose={() => setPrevenir(null)} />}
    </div>
  )
}
