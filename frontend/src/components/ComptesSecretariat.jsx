import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'

const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

/* Comptes du secrétariat (Paramètres, admin) : la secrétaire inscrit les élèves, encaisse,
   gère leçons et examens, sans accès aux moniteurs, aux paramètres ni aux suppressions.
   Le mot de passe n'est affiché qu'une fois, à la création ou au renouvellement. */
export default function ComptesSecretariat() {
  const [comptes, setComptes] = useState([])
  const [form, setForm] = useState({ nom: '', telephone: '' })
  const [identifiants, setIdentifiants] = useState(null)   // { nom, identifiant, motDePasse }
  const [busy, setBusy] = useState(false)

  const load = () => api('GET', '/admin/secretaires').then(setComptes).catch(() => {})
  useEffect(() => { load() }, [])

  const creer = async () => {
    if (!form.nom.trim() || !form.telephone.trim()) { toast('Nom et téléphone sont obligatoires', 'warning'); return }
    setBusy(true)
    try {
      setIdentifiants(await api('POST', '/admin/secretaires', form))
      setForm({ nom: '', telephone: '' }); toast('Compte créé'); load()
    } catch (e) { toast(e.message, 'danger') }
    finally { setBusy(false) }
  }

  const regenerer = async (c) => {
    if (!(await confirmer({ titre: `Nouveau mot de passe pour ${c.nom} ?`, libelle: 'Générer',
      message: "L'ancien mot de passe ne fonctionnera plus." }))) return
    try { setIdentifiants(await api('POST', `/admin/secretaires/${c.id}/identifiants`)) }
    catch (e) { toast(e.message, 'danger') }
  }

  const basculer = async (c) => {
    try { await api('PATCH', `/admin/secretaires/${c.id}/actif`); toast(c.actif ? 'Compte désactivé' : 'Compte réactivé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const supprimer = async (c) => {
    if (!(await confirmer({ titre: `Supprimer le compte de ${c.nom} ?`, ton: 'danger', libelle: 'Supprimer',
      message: 'Elle ne pourra plus se connecter. Les élèves et paiements qu\'elle a saisis sont conservés.' }))) return
    try { await api('DELETE', `/admin/secretaires/${c.id}`); toast('Compte supprimé'); setIdentifiants(null); load() }
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
            <i className="bi bi-person-workspace" />
          </div>
          <div>
            <div className="fw-bold" style={{ color: '#1e293b' }}>Comptes du secrétariat</div>
            <div className="text-slate-400" style={{ fontSize: '.82rem' }}>
              Inscrire les élèves, encaisser, gérer leçons et examens · sans moniteurs, paramètres ni suppressions
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
                Transmettez-les-lui maintenant : le mot de passe ne sera plus affiché. Elle pourra le changer
                avec « Changer le mot de passe ».
              </div>
              <div className="d-flex gap-2 mt-2">
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
                    <div className="fw-semibold text-truncate" style={{ color: '#1e293b' }}>{c.nom}</div>
                    <div className="text-slate-500" style={{ fontSize: '.8rem' }}>
                      <i className="bi bi-telephone me-1" />{c.identifiant}{!c.actif && ' · désactivé'}
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}

          {/* Nouveau compte */}
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className={labelCls}>Prénom et nom</label>
              <input className="form-control" value={form.nom} placeholder="Ex : Awa Ndiaye"
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className={labelCls}>Téléphone (identifiant)</label>
              <input type="tel" className="form-control" value={form.telephone} placeholder="77 123 45 67"
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
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
