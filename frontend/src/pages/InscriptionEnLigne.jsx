import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ChampTelephone from '../components/ChampTelephone'
import '../landing.css'

/* Appel public, sans jeton : un jeton périmé ne doit pas renvoyer le candidat vers la connexion. */
async function appelPublic(method, url, body) {
  const res = await fetch('/api' + url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || (data.erreurs && Object.values(data.erreurs).join(' · ')) || 'Envoi impossible, réessayez')
  return data
}

const FORMATIONS = [
  { v: 'B',    icon: 'car-front-fill',        titre: 'Permis B',    sous: 'Voiture' },
  { v: 'A',    icon: 'scooter',               titre: 'Permis A',    sous: 'Moto' },
  { v: 'C',    icon: 'truck-front-fill',      titre: 'Permis C',    sous: 'Poids lourd' },
  { v: 'D',    icon: 'bus-front-fill',        titre: 'Permis D',    sous: 'Transport' },
  { v: 'CP_M', icon: 'gear-wide-connected',   titre: 'Perfectionnement', sous: 'Boîte manuelle' },
  { v: 'CP_A', icon: 'lightning-charge-fill', titre: 'Perfectionnement', sous: 'Boîte automatique' },
]
const fcfa = n => `${Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ')} F`

/* Formules de la formation choisie (Paramètres) : { cle envoyée au serveur, titre, montant, acompte, tranches }. */
function formulesDe(infos, formation) {
  if (!formation) return []
  if (formation.startsWith('CP_')) {
    const boite = formation === 'CP_A' ? 'AUTOMATIQUE' : 'MANUELLE'
    return (infos.formulesPerfectionnement || []).filter(f => f.boite === boite).map(f => ({
      cle: String(f.cours), titre: `${f.cours} cours`, montant: f.montant, acompte: f.acompte,
      tranches: [f.acompte, f.tranche2].filter(x => Number(x) > 0),
    }))
  }
  return (infos.formules || []).map(f => ({
    cle: f.nom, titre: f.nom, montant: f.montant, acompte: f.acompte,
    tranches: [f.acompte, f.tranche2, f.tranche3].filter(x => Number(x) > 0),
  }))
}

const champ = 'w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:border-[#1e3a5f] transition-all'
const etiquette = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

/* Page publique « S'inscrire en ligne » : la demande part en attente ; la secrétaire ou l'admin
   vérifie l'acompte (Wave / Orange Money) et l'approuve, puis envoie les identifiants sur WhatsApp. */
export default function InscriptionEnLigne() {
  const [infos, setInfos] = useState({})
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', formation: '', formule: '', montantAcompte: '', moyenPaiement: 'WAVE', transactionId: '', siteWeb: '' })
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [fait, setFait] = useState(null)
  // Le message d'erreur disparaît dès que le candidat corrige un champ
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErreur('') }
  useEffect(() => { appelPublic('GET', '/public/inscriptions/infos').then(setInfos).catch(() => {}) }, [])

  const formules = formulesDe(infos, form.formation)
  const formule = formules.find(f => f.cle === form.formule)
  // Changer de formation efface la formule ; choisir une formule propose son acompte
  const choisirFormation = v => { setForm(f => ({ ...f, formation: v, formule: f.formation === v ? f.formule : '' })); setErreur('') }
  const choisirFormule = f => { setForm(x => ({ ...x, formule: f.cle, montantAcompte: String(f.acompte) })); setErreur('') }

  const envoyer = async (e) => {
    e.preventDefault(); setErreur('')
    const manque = [!form.prenom.trim() && 'prénom', !form.nom.trim() && 'nom', !form.telephone && 'téléphone', !form.formation && 'formation',
      formules.length > 0 && !formule && 'formule',
      !(parseFloat(form.montantAcompte) > 0) && 'acompte', !form.transactionId.trim() && 'référence de la transaction'].filter(Boolean)
    if (manque.length) { setErreur(`À remplir : ${manque.join(', ')}`); return }
    setEnvoi(true)
    try { setFait(await appelPublic('POST', '/public/inscriptions', { ...form, montantAcompte: parseFloat(form.montantAcompte) })) }
    catch (e2) { setErreur(e2.message) }
    finally { setEnvoi(false) }
  }

  const lien = form.moyenPaiement === 'WAVE' ? infos.lienWave : infos.lienOrangeMoney
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: 'linear-gradient(160deg, #0f2240 0%, #1e3a5f 50%, #1a3355 100%)' }}>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="text-blue-200 text-sm" style={{ textDecoration: 'none' }}><i className="bi bi-arrow-left me-1" />Accueil</Link>
          <Link to="/login" className="text-blue-200 text-sm" style={{ textDecoration: 'none' }}>Déjà inscrit ? <b className="text-white">Se connecter</b></Link>
        </div>
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
          <div className="px-6 py-5 relative" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 55%,#2a4f7c)' }}>
            <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>{infos.nom || 'Auto-École Khadija'}</div>
            <h1 className="text-2xl font-extrabold text-white m-0 mt-1">S'inscrire en ligne</h1>
            <p className="text-sm m-0 mt-1" style={{ color: '#bfdbfe' }}>Réglez l'acompte par Wave ou Orange Money : l'auto-école valide votre inscription et vous envoie vos identifiants sur WhatsApp.</p>
          </div>

          {fait ? (
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl" style={{ background: '#dcfce7', color: '#15803d' }}>
                <i className="bi bi-check-lg" />
              </div>
              <h2 className="text-xl font-extrabold mt-4" style={{ color: '#1e3a5f' }}>Merci {fait.prenom || ''} !</h2>
              <p className="text-slate-600 text-sm mt-2">Votre demande est bien envoyée. Dès que l'auto-école aura vérifié votre acompte,
                vous recevrez vos identifiants de connexion par <b>WhatsApp</b>.</p>
              <Link to="/" className="inline-block mt-5 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: '#1e3a5f', textDecoration: 'none' }}>Retour à l'accueil</Link>
            </div>
          ) : (
            <form onSubmit={envoyer} className="px-6 py-5 space-y-5" noValidate>
              {/* Champ piège : invisible pour une personne, rempli par les robots */}
              <input type="text" name="site_web" tabIndex={-1} autoComplete="off" value={form.siteWeb} onChange={e => set('siteWeb', e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={etiquette}>Prénom</label><input className={champ} value={form.prenom} onChange={e => set('prenom', e.target.value)} autoComplete="given-name" /></div>
                <div><label className={etiquette}>Nom</label><input className={champ} value={form.nom} onChange={e => set('nom', e.target.value)} autoComplete="family-name" /></div>
                <div className="sm:col-span-2">
                  <label className={etiquette}>Téléphone (WhatsApp)</label>
                  <ChampTelephone className={champ} value={form.telephone} onChange={v => set('telephone', v)} />
                  <div className="text-[11px] text-slate-400 mt-1">Il deviendra votre identifiant de connexion</div>
                </div>
              </div>

              <div>
                <label className={etiquette}>Formation</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATIONS.map(f => {
                    const actif = form.formation === f.v
                    return (
                      <button key={f.v} type="button" onClick={() => choisirFormation(f.v)}
                        className="flex flex-col items-center gap-0.5 py-3 px-2 cursor-pointer text-center"
                        style={{ borderRadius: '.9rem', border: `2px solid ${actif ? '#1e3a5f' : '#e2e8f0'}`, background: actif ? '#fef9c3' : '#fff', color: actif ? '#1e3a5f' : '#64748b' }}>
                        <i className={`bi bi-${f.icon}`} style={{ fontSize: '1.3rem', color: actif ? '#d4a017' : undefined }} />
                        <span className="text-sm font-extrabold leading-tight">{f.titre}</span>
                        <span className="text-[11px] font-semibold">{f.sous}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {formules.length > 0 && (
                <div>
                  <label className={etiquette}>Formule</label>
                  <div className="grid grid-cols-2 gap-2">
                    {formules.map(f => {
                      const actif = form.formule === f.cle
                      return (
                        <button key={f.cle} type="button" onClick={() => choisirFormule(f)} aria-pressed={actif}
                          className="flex flex-col items-start text-left py-3 px-3 cursor-pointer"
                          style={{ borderRadius: '.9rem', border: `2px solid ${actif ? '#1e3a5f' : '#e2e8f0'}`, background: actif ? '#fef9c3' : '#fff', color: '#1e3a5f' }}>
                          <span className="text-sm font-extrabold leading-tight">{f.titre}</span>
                          <span className="text-lg font-extrabold leading-tight mt-0.5" style={{ color: '#b45309' }}>{fcfa(f.montant)}</span>
                          <span className="text-[11px] font-semibold text-slate-500 mt-1">
                            {f.tranches.length > 1 ? `Acompte ${fcfa(f.acompte)}, puis ${f.tranches.slice(1).map(fcfa).join(' + ')}` : 'Payé en une fois'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl p-4" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                <div className="font-extrabold text-sm mb-1" style={{ color: '#1e3a5f' }}><i className="bi bi-wallet2 me-1" />Acompte</div>
                {formule && (
                  <div className="text-xs font-semibold rounded-xl px-3 py-2 mb-2" style={{ background: '#fef9c3', color: '#854d0e' }}>
                    Formule {formule.titre} : acompte de <b>{fcfa(formule.acompte)}</b> sur {fcfa(formule.montant)}
                  </div>
                )}
                <ol className="text-xs text-slate-600 ps-4 mb-3">
                  <li>Choisissez Wave ou Orange Money et payez l'acompte avec le bouton.</li>
                  <li>Revenez ici et saisissez le montant et la référence reçue par SMS.</li>
                </ol>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[['WAVE', 'Wave', '#0284c7', '#e0f2fe', 'water'], ['ORANGE_MONEY', 'Orange Money', '#ea580c', '#ffedd5', 'phone-fill']].map(([v, txt, c, bg, ic]) => (
                    <button key={v} type="button" onClick={() => set('moyenPaiement', v)}
                      className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold cursor-pointer"
                      style={{ borderRadius: '.8rem', border: `2px solid ${form.moyenPaiement === v ? c : '#e2e8f0'}`, background: form.moyenPaiement === v ? bg : '#fff', color: form.moyenPaiement === v ? c : '#64748b' }}>
                      <i className={`bi bi-${ic}`} />{txt}
                    </button>
                  ))}
                </div>
                {lien && (
                  <a href={lien} target="_blank" rel="noopener noreferrer"
                    className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white"
                    style={{ textDecoration: 'none', background: form.moyenPaiement === 'WAVE' ? '#1dc8f2' : '#ff7900' }}>
                    <i className="bi bi-box-arrow-up-right" />Payer avec {form.moyenPaiement === 'WAVE' ? 'Wave' : 'Orange Money'}
                  </a>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={etiquette}>Montant payé</label>
                    <div className="relative"><input type="number" min="0" inputMode="numeric" className={champ} style={{ paddingRight: '3.5rem' }} placeholder="50000"
                      value={form.montantAcompte} onChange={e => set('montantAcompte', e.target.value)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span></div></div>
                  <div><label className={etiquette}>Référence de la transaction</label>
                    <input className={champ} placeholder="Ex. T_8H3K2…" value={form.transactionId} onChange={e => set('transactionId', e.target.value)} /></div>
                </div>
              </div>

              {erreur && <div className="text-sm font-semibold rounded-xl px-3 py-2" style={{ background: '#fef2f2', color: '#b91c1c' }}>{erreur}</div>}
              <button type="submit" disabled={envoi}
                className="w-full py-3 font-bold text-base border-0 cursor-pointer"
                style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', boxShadow: '0 6px 18px rgba(212,160,23,.35)' }}>
                {envoi ? 'Envoi…' : <>Envoyer ma demande d'inscription <i className="bi bi-arrow-right ms-1" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
