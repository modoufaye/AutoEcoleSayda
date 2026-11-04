import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'

const ROLES = { ELEVE: 'Élève', MONITEUR: 'Moniteur', SECRETAIRE: 'Secrétariat', SUPER_ADMIN: 'Administrateur' }

/* Comptes bloqués après 5 mots de passe faux (tableau de bord de l'admin et du secrétariat).
   Rien ne s'affiche tant qu'aucun compte n'est bloqué. Le serveur ne renvoie à la secrétaire
   que les élèves et les moniteurs. */
export default function ComptesBloques() {
  const [comptes, setComptes] = useState([])
  const load = () => api('GET', '/comptes-bloques').then(setComptes).catch(() => {})
  useEffect(() => { load() }, [])

  const debloquer = async (c) => {
    try { await api('POST', `/comptes-bloques/${c.id}/debloquer`); toast(`Compte de ${c.nom} débloqué`); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  if (comptes.length === 0) return null
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1.5px solid #fecaca' }}>
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2', color: '#b91c1c' }}>
          <i className="bi bi-shield-lock-fill" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-sm" style={{ color: '#991b1b' }}>
            {comptes.length} compte{comptes.length > 1 ? 's' : ''} bloqué{comptes.length > 1 ? 's' : ''}
          </div>
          <div className="text-xs" style={{ color: '#b91c1c' }}>5 mots de passe incorrects · à débloquer sur demande de la personne</div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {comptes.map(c => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: '#1e3a5f' }}>{c.nom}</div>
              <div className="text-xs text-slate-500"><i className="bi bi-person me-1" />{c.identifiant} · {ROLES[c.role] || c.role}</div>
            </div>
            <button type="button" onClick={() => debloquer(c)}
              className="flex items-center gap-2 text-sm font-bold text-white px-4 border-0 cursor-pointer"
              style={{ minHeight: 36, borderRadius: 999, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
              <i className="bi bi-unlock-fill" />Débloquer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
