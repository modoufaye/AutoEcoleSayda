import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { waLink } from '../utils'
import { msgBienvenueSecretaire, msgBienvenueAdmin } from '../messages'
import ChampTelephone from './ChampTelephone'

const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

/* Comptes du secrétariat (Paramètres, admin) : la secrétaire inscrit les élèves, encaisse,
   gère leçons et examens, sans accès aux moniteurs, aux paramètres ni aux suppressions.
   Même écran pour les comptes super admin (type="admin"), avec les garde-fous du serveur :
   on ne se retire pas soi-même et il reste toujours un admin actif.
   Le mot de passe n'est affiché qu'une fois, à la création ou au renouvellement. */
const TYPES = {
  secretariat: {
    route: '/admin/secretaires', icone: 'bi-person-workspace', titre: 'Comptes du secrétariat', message: msgBienvenueSecretaire,
    sousTitre: 'Inscrire les élèves, encaisser, gérer leçons et examens · sans moniteurs, paramètres ni suppressions',
    suppression: "Elle ne pourra plus se connecter. Les élèves et paiements qu'elle a saisis sont conservés.", pronom: 'Elle',
  },
  admin: {
    route: '/admin/administrateurs', icone: 'bi-shield-lock-fill', titre: 'Comptes administrateurs', message: msgBienvenueAdmin,
    sousTitre: 'Administrateur : tous les droits sauf les comptes administrateurs · Super admin : tous les droits, comme vous',
    suppression: 'Cette personne ne pourra plus se connecter. Les données de l\'auto-école sont conservées.', pronom: 'Cette personne',
  },
}

export default function ComptesSecretariat({ type = 'secretariat' }) {
  const T = TYPES[type]
  const [comptes, setComptes] = useState([])
  const formVide = { nom: '', telephone: '', ...(type === 'admin' ? { role: 'ADMIN' } : {}) }
  const [form, setForm] = useState(formVide)
  const [identifiants, setIdentifiants] = useState(null)   // { nom, identifiant, motDePasse }
  const [busy, setBusy] = useState(false)
  const [ecole, setEcole] = useState('')

  const route = T.route
  const load = () => api('GET', route).then(setComptes).catch(() => {})
  useEffect(() => {
    api('GET', route).then(setComptes).catch(() => {})
    api('GET', '/config').then(c => setEcole(c?.nom || '')).catch(() => {})
  }, [route])
  // Message de bienvenue WhatsApp, comme pour les élèves et les moniteurs
  const lienWhatsApp = identifiants && waLink(identifiants.identifiant, T.message(identifiants, ecole))

  const creer = async () => {
    if (!form.nom.trim() || !form.telephone.trim()) { toast('Nom et téléphone sont obligatoires', 'warning'); return }
    setBusy(true)
    try {
      setIdentifiants(await api('POST', T.route, form))
      setForm(formVide); toast('Compte créé'); load()
    } catch (e) { toast(e.message, 'danger') }
    finally { setBusy(false) }
  }

  const regenerer = async (c) => {
    if (!(await confirmer({ titre: `Nouveau mot de passe pour ${c.nom} ?`, libelle: 'Générer',
      message: "L'ancien mot de passe ne fonctionnera plus." }))) return
    try { setIdentifiants(await api('POST', `${T.route}/${c.id}/identifiants`)) }
    catch (e) { toast(e.message, 'danger') }
  }

  const basculer = async (c) => {
    try { await api('PATCH', `${T.route}/${c.id}/actif`); toast(c.actif ? 'Compte désactivé' : 'Compte réactivé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  /* Comptes administrateurs : passer un autre compte de super admin à administrateur, ou l'inverse */
  const changerRole = async (c) => {
    const vers = c.role === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN'
    if (!(await confirmer({ titre: `Passer ${c.nom} en ${vers === 'ADMIN' ? 'administrateur' : 'super admin'} ?`, libelle: 'Changer le rôle',
      message: vers === 'ADMIN'
        ? "Cette personne gardera tous les droits, sauf la gestion des comptes administrateurs et du super admin. Ses droits changent tout de suite ; son menu se met à jour à sa prochaine connexion."
        : "Cette personne aura tous les droits, comme vous, y compris la gestion des comptes administrateurs. Ses droits changent tout de suite ; son menu se met à jour à sa prochaine connexion." }))) return
    try { await api('PATCH', `${T.route}/${c.id}/role`, { role: vers }); toast('Rôle modifié'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const supprimer = async (c) => {
    if (!(await confirmer({ titre: `Supprimer le compte de ${c.nom} ?`, ton: 'danger', libelle: 'Supprimer',
      message: T.suppression }))) return
    try { await api('DELETE', `${T.route}/${c.id}`); toast('Compte supprimé'); setIdentifiants(null); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`Identifiant : ${identifiants.identifiant}\nMot de passe : ${identifiants.motDePasse}`)
      toast('Identifiants copiés')
    } catch { toast('Copie impossible : recopiez-les à la main', 'warning') }
  }

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
      <div className="card-body p-0">
        <div className="d-flex align-items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: 'rgba(212,160,23,.14)', color: '#a16207', width: 38, height: 38, borderRadius: '.75rem' }}>
            <i className={`bi ${T.icone}`} />
          </div>
          <div>
            <div className="fw-bold" style={{ color: '#1e293b' }}>{T.titre}</div>
            <div className="text-slate-400" style={{ fontSize: '.82rem' }}>
              {T.sousTitre}
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Identifiants à transmettre : affichés une seule fois */}
          {identifiants && (
            <div className="rounded-xl p-3 mb-4" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
              <div className="fw-bold mb-1" style={{ color: '#92400e', fontSize: '.88rem' }}>
                <i className="bi bi-key-fill me-1" />Identifiants de {identifiants.nom}
              </div>
              <div style={{ fontSize: '.88rem', color: '#1e293b' }}>
                Identifiant : <strong>{identifiants.identifiant}</strong><br />
                Mot de passe : <strong style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.04em' }}>{identifiants.motDePasse}</strong>
              </div>
              <div className="text-slate-500 mt-1" style={{ fontSize: '.78rem' }}>
                Envoyez-les-lui maintenant, sur WhatsApp ou en les copiant : le mot de passe ne sera plus affiché. {T.pronom} pourra le changer
                avec « Changer le mot de passe ».
              </div>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {lienWhatsApp && (
                  <a href={lienWhatsApp} target="_blank" rel="noopener noreferrer"
                    className="btn btn-sm fw-bold text-white d-inline-flex align-items-center gap-1"
                    style={{ background: '#25d366', borderRadius: '.6rem', border: 'none' }}>
                    <i className="bi bi-whatsapp" />Envoyer sur WhatsApp
                  </a>
                )}
                <button className="btn btn-sm fw-semibold" style={{ background: '#1e3a5f', color: '#fff', borderRadius: '.6rem' }} onClick={copier}>
                  <i className="bi bi-clipboard me-1" />Copier
                </button>
                <button className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: '.6rem' }} onClick={() => setIdentifiants(null)}>
                  Masquer
                </button>
              </div>
            </div>
          )}

          {comptes.length > 0 && (
            <div className="mb-4 d-flex flex-column gap-2">
              {comptes.map(c => (
                <div key={c.id} className="d-flex flex-wrap align-items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', opacity: c.actif ? 1 : .6 }}>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-truncate" style={{ color: '#1e293b' }}>{c.nom}{c.role && <span className="badge ms-2" style={c.role === 'SUPER_ADMIN' ? { background: '#fef3c7', color: '#92400e' } : { background: '#e0f2fe', color: '#075985' }}>{c.role === 'SUPER_ADMIN' ? 'Super admin' : 'Administrateur'}</span>}{c.moi && <span className="badge ms-2" style={{ background: '#e0e7ff', color: '#3730a3' }}>vous</span>}</div>
                    <div className="text-slate-500" style={{ fontSize: '.8rem' }}>
                      <i className={`bi ${c.identifiant?.includes('@') ? 'bi-envelope' : 'bi-telephone'} me-1`} />{c.identifiant}{!c.actif && ' · désactivé'}
                    </div>
                  </div>
                  {!c.moi && <>
                  {c.role && (
                    <button className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: '.6rem' }} onClick={() => changerRole(c)}
                      title={c.role === 'SUPER_ADMIN' ? 'Passer en administrateur' : 'Passer en super admin'}>
                      <i className={`bi ${c.role === 'SUPER_ADMIN' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} me-1`} />
                      {c.role === 'SUPER_ADMIN' ? 'Passer administrateur' : 'Passer super admin'}
                    </button>
                  )}
                  <button className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: '.6rem' }} onClick={() => regenerer(c)}>
                    <i className="bi bi-key me-1" />Nouveau mot de passe
                  </button>
                  <button className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: '.6rem' }} onClick={() => basculer(c)}>
                    {c.actif ? <><i className="bi bi-pause-circle me-1" />Désactiver</> : <><i className="bi bi-play-circle me-1" />Réactiver</>}
                  </button>
                  <button className="btn btn-sm fw-semibold" style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '.6rem' }}
                    title="Supprimer le compte" onClick={() => supprimer(c)}>
                    <i className="bi bi-trash-fill" />
                  </button>
                  </>}
                </div>
              ))}
            </div>
          )}

          {/* Nouveau compte */}
          <div className="row g-3 align-items-end">
            {type === 'admin' && (
              <div className="col-12">
                <label className={labelCls}>Rôle du nouveau compte</label>
                <div className="d-flex flex-wrap gap-2">
                  {[['ADMIN', 'Administrateur', 'Tous les droits sauf créer un administrateur ou toucher à un super admin'],
                    ['SUPER_ADMIN', 'Super admin', 'Tous les droits, dont la gestion des comptes administrateurs']].map(([v, l, d]) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, role: v }))}
                      className="btn text-start flex-grow-1" style={{ borderRadius: '.75rem', minWidth: 220,
                        border: `2px solid ${form.role === v ? '#1e3a5f' : '#e2e8f0'}`, background: form.role === v ? '#eff6ff' : '#fff' }}>
                      <div className="fw-bold" style={{ color: '#1e293b', fontSize: '.9rem' }}>
                        <i className={`bi ${form.role === v ? 'bi-record-circle-fill' : 'bi-circle'} me-2`} style={{ color: '#1e3a5f' }} />{l}
                      </div>
                      <div className="text-slate-500" style={{ fontSize: '.78rem' }}>{d}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="col-md-4">
              <label className={labelCls}>Prénom et nom</label>
              <input className="form-control" value={form.nom} placeholder="Ex : Awa Ndiaye"
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className={labelCls}>Téléphone (identifiant)</label>
              <ChampTelephone className="form-control" value={form.telephone} onChange={v => setForm(f => ({ ...f, telephone: v }))} />
            </div>
            <div className="col-md-4">
              <button className="btn fw-bold w-100 text-nowrap" disabled={busy} onClick={creer}
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.75rem', border: 'none' }}>
                <i className="bi bi-person-plus-fill me-1" />Créer le compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
