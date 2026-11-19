import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { api } from '../api'
import { waLink, ROLE_BASE } from '../utils'
import { EnteteListe } from './ListeModerne'

/* Tableau de bord (admin, secrétariat) : qui est prêt pour l'examen du code, parmi les élèves du
   permis en cours et pas encore admis.
   Prêt     = moitié de la formule payée + dossier complet + 70 % des séances publiées assimilées ;
   Presque  = moitié payée + dossier complet (séances pas encore à 70 %) ;
   Pas encore = le reste. */

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const NIVEAUX = [
  { cle: 'PRET', total: 'prets', nom: 'Prêts', aide: 'Moitié payée, dossier complet, 70 % des séances assimilées', icone: 'patch-check-fill', couleur: '#10b981', fond: '#ecfdf5' },
  { cle: 'PRESQUE', total: 'presque', nom: 'Presque', aide: 'Moitié payée et dossier complet ; séances à terminer', icone: 'hourglass-bottom', couleur: '#f59e0b', fond: '#fffbeb' },
  { cle: 'PAS_ENCORE', total: 'pasEncore', nom: 'Pas encore', aide: 'Paiement ou dossier à compléter', icone: 'hourglass-split', couleur: '#94a3b8', fond: '#f1f5f9' },
]

function Eleve({ e, detail, onOuvrir }) {
  const lien = waLink(e.telephone)
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#f8fafc' }}>
      <div className="flex-1 min-w-0">
        <button type="button" onClick={() => onOuvrir(e)} title={`Ouvrir la fiche de ${e.nom}`}
          className="block max-w-full text-left text-sm font-bold truncate border-0 bg-transparent p-0 cursor-pointer hover:underline" style={{ color: ENCRE }}>
          {e.nom}
        </button>
        <div className="text-[11px] text-slate-500 truncate">{detail}</div>
      </div>
      {lien && (
        <a href={lien} target="_blank" rel="noreferrer" title="Écrire sur WhatsApp" aria-label={`WhatsApp à ${e.nom}`}
          className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ borderRadius: 999, background: '#25d366', color: '#fff', textDecoration: 'none' }}>
          <i className="bi bi-whatsapp" />
        </a>
      )}
    </div>
  )
}

export default function PreparationCode() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const ouvrir = e => navigate(`${ROLE_BASE[user?.role] || '/dashboard'}/eleves/${e.id}`)
  const [d, setD] = useState(null)
  const [tousPresque, setTousPresque] = useState(false)
  useEffect(() => {
    let vivant = true
    api('GET', '/dashboard/preparation-code').then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [])
  if (!d) return null

  const total = d.eleves.length
  const prets = d.eleves.filter(e => e.indicateur === 'PRET')
  // Presque : les plus proches des 70 % d'abord
  const presque = d.eleves.filter(e => e.indicateur === 'PRESQUE').sort((a, b) => b.seancesAssimilees - a.seancesAssimilees)
  const pasEncore = d.eleves.filter(e => e.indicateur === 'PAS_ENCORE')
  const sansPaiement = pasEncore.filter(e => !e.moitiePayee).length
  const sansDossier = pasEncore.filter(e => e.piecesManquantes.length > 0).length

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="clipboard2-check-fill" titre="Prêts pour l'examen du code"
        sousTitre={`${total} élève${total > 1 ? 's' : ''} du permis pas encore admis · ${d.seancesRequises} séance${d.seancesRequises > 1 ? 's' : ''} à assimiler sur ${d.seancesPubliees} publiée${d.seancesPubliees > 1 ? 's' : ''}`}
        nombre={d.prets} />
      <div className="p-5 flex flex-col gap-5">
        {/* Les trois niveaux */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {NIVEAUX.map(n => (
            <div key={n.cle} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={{ background: n.fond }}>
              <i className={`bi bi-${n.icone} text-xl`} style={{ color: n.couleur }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black" style={{ color: ENCRE }}>{d[n.total]}</span>
                  <span className="text-sm font-bold text-slate-700">{n.nom}</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">{n.aide}</div>
              </div>
            </div>
          ))}
        </div>

        {/* À inscrire à la prochaine session */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">
            <i className="bi bi-patch-check-fill me-1" style={{ color: '#10b981' }} />À inscrire à l'examen du code
          </div>
          {prets.length === 0
            ? <div className="text-sm text-slate-500">Aucun élève prêt pour l'instant.</div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {prets.map(e => <Eleve key={e.id} e={e} onOuvrir={ouvrir} detail={`${e.seancesAssimilees} séance${e.seancesAssimilees > 1 ? 's' : ''} assimilée${e.seancesAssimilees > 1 ? 's' : ''} · dossier complet`} />)}
              </div>}
        </div>

        {/* Presque : il ne manque que les séances */}
        {presque.length > 0 && (
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">
              <i className="bi bi-hourglass-bottom me-1" style={{ color: '#f59e0b' }} />Presque prêts : séances à terminer
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {(tousPresque ? presque : presque.slice(0, 6)).map(e => (
                <Eleve key={e.id} e={e} onOuvrir={ouvrir}
                  detail={`Séances : ${e.seancesAssimilees}/${e.seancesRequises} assimilées · encore ${Math.max(0, e.seancesRequises - e.seancesAssimilees)}`} />
              ))}
            </div>
            {presque.length > 6 && (
              <button type="button" onClick={() => setTousPresque(x => !x)} className="mt-2 text-xs font-bold bg-transparent border-0 p-0 cursor-pointer" style={{ color: '#2563eb' }}>
                {tousPresque ? 'Voir moins' : `Voir les ${presque.length}`}
              </button>
            )}
          </div>
        )}

        {/* Pas encore : ce qui bloque le plus */}
        {pasEncore.length > 0 && (
          <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            <span><i className="bi bi-hourglass-split me-1" />Pas encore prêts :</span>
            <span><i className="bi bi-cash-coin me-1" style={{ color: '#b91c1c' }} /><b className="text-slate-700">{sansPaiement}</b> sans la moitié de la formule payée</span>
            <span><i className="bi bi-folder-x me-1" style={{ color: '#b45309' }} /><b className="text-slate-700">{sansDossier}</b> avec un dossier incomplet</span>
          </div>
        )}
        <div className="text-[11px] text-slate-400"><i className="bi bi-info-circle me-1" />Séance assimilée : quiz réussi au moins une fois à 70 % ou plus. Dossier complet : résidence, CNI, groupe sanguin, visite médicale, photos et timbre. Liste des élèves : filtre « Examen du code ».</div>
      </div>
    </div>
  )
}
