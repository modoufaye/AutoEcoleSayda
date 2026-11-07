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
  { v: 'CP_M', icon: 'gear-wide-connected',   titre: 'Perfectionnement', sous: 'Boîte manuelle', perf: true },
  { v: 'CP_A', icon: 'lightning-charge-fill', titre: 'Perfectionnement', sous: 'Boîte automatique', perf: true },
]
const ETAPES = [
  { icon: 'pencil-square',  titre: 'Remplissez le formulaire', texte: 'Vos coordonnées, votre formation et votre formule.' },
  { icon: 'phone-vibrate',  titre: "Réglez l'acompte",          texte: 'Par Wave ou Orange Money, en quelques secondes.' },
  { icon: 'whatsapp',       titre: 'Recevez vos identifiants',  texte: "Sur WhatsApp, dès que l'auto-école a vérifié l'acompte." },
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
  // Permis A, et permis C et D : chacun une seule formule Standard ; B : les quatre formules
  const liste = formation === 'A' ? infos.formulesMoto : formation === 'C' || formation === 'D' ? infos.formulesPoidsLourd : infos.formules
  return (liste || []).map(f => ({
    cle: f.nom, titre: f.nom, montant: f.montant, acompte: f.acompte,
    tranches: [f.acompte, f.tranche2, f.tranche3].filter(x => Number(x) > 0), contenu: f.contenu || [],
  }))
}

const champ = 'w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-[15px] outline-none focus:bg-white focus:border-[#d4a017] transition-all'
const etiquette = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'

/* Animations douces à l'arrivée, coupées si l'appareil demande moins de mouvement. */
const STYLE = `
@keyframes ins-monte { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes ins-halo { 0%, 100% { transform: scale(1); opacity: .5 } 50% { transform: scale(1.15); opacity: .8 } }
.ins-monte { animation: ins-monte .6s cubic-bezier(.2,.7,.2,1) both }
.ins-tuile { transition: transform .15s, box-shadow .15s, border-color .15s }
.ins-tuile:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,34,64,.10) }
@media (prefers-reduced-motion: reduce) { .ins-monte, .ins-halo { animation: none !important } .ins-tuile:hover { transform: none } }
`

/* Titre d'étape numéroté ; la pastille devient une coche quand l'étape est complète. */
function Section({ n, titre, sous, fait, children }) {
  return (
    <section className="ins-monte" style={{ animationDelay: `${n * 70}ms` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all"
          style={fait ? { background: '#16a34a', color: '#fff' } : { background: '#1e3a5f', color: '#f0bb2a' }}>
          {fait ? <i className="bi bi-check-lg" /> : n}
        </div>
        <div className="min-w-0">
          <h2 className="font-extrabold m-0 leading-tight" style={{ color: '#0f2240', fontSize: '1.05rem', fontWeight: 800 }}>{titre}</h2>
          {sous && <div className="text-xs text-slate-400">{sous}</div>}
        </div>
      </div>
      {children}
    </section>
  )
}

/* Page publique « S'inscrire en ligne » : la demande part en attente ; la secrétaire ou l'admin
   vérifie l'acompte (Wave / Orange Money) et l'approuve, puis envoie les identifiants sur WhatsApp. */
export default function InscriptionEnLigne() {  const [infos, setInfos] = useState({})
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', formation: '', formule: '', montantAcompte: '', moyenPaiement: 'WAVE', siteWeb: '' })
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
      !(parseFloat(form.montantAcompte) > 0) && 'acompte'].filter(Boolean)
    if (manque.length) { setErreur(`À remplir : ${manque.join(', ')}`); return }
    setEnvoi(true)
    try { setFait(await appelPublic('POST', '/public/inscriptions', { ...form, montantAcompte: parseFloat(form.montantAcompte) })) }
    catch (e2) { setErreur(e2.message) }
    finally { setEnvoi(false) }
  }

  const lien = form.moyenPaiement === 'WAVE' ? infos.lienWave : infos.lienOrangeMoney
  const formation = FORMATIONS.find(f => f.v === form.formation)
  const acompte = parseFloat(form.montantAcompte) || 0
  // Avancement : une étape compte quand ses champs obligatoires sont remplis
  const faits = {
    vous: !!(form.prenom.trim() && form.nom.trim() && form.telephone),
    formation: !!form.formation,
    formule: !!form.formation && (formules.length === 0 || !!formule),
    acompte: acompte > 0,
  }
  const pct = Math.round(Object.values(faits).filter(Boolean).length / 4 * 100)
  const ecole = infos.nom || 'Auto-École Khadija'

  const recap = (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)' }}>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#f0bb2a' }}>Votre inscription</div>
      {[
        ['person', 'Candidat', `${form.prenom} ${form.nom}`.trim() || '—'],
        ['mortarboard', 'Formation', formation ? `${formation.titre}${formation.perf ? ` · ${formation.sous.toLowerCase()}` : ''}` : '—'],
        ['award', 'Formule', formule ? formule.titre : '—'],
      ].map(([ic, l, v]) => (
        <div key={l} className="flex items-center justify-between gap-3 py-1.5 text-sm">
          <span className="text-blue-200"><i className={`bi bi-${ic} me-2`} />{l}</span>
          <span className="font-semibold text-white text-right truncate">{v}</span>
        </div>
      ))}
      {formule && (
        <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px dashed rgba(255,255,255,.2)' }}>
          {[['Total', formule.montant, '#fff'], ['Acompte', acompte || formule.acompte, '#f0bb2a'], ['Reste', Math.max(0, formule.montant - (acompte || formule.acompte)), '#93c5fd']].map(([l, v, c]) => (
            <div key={l}>
              <div className="text-[10px] uppercase tracking-wider text-blue-200">{l}</div>
              <div className="font-extrabold text-sm" style={{ color: c }}>{fcfa(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen w-full relative overflow-hidden"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: 'linear-gradient(135deg, #0f2240 0%, #1e3a5f 50%, #2a4f7c 100%)' }}>
      <style>{STYLE}</style>
      {/* Décor : halos dorés et grille fine, comme la page d'accueil */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="ins-halo absolute rounded-full" style={{ width: 620, height: 620, top: -260, right: -220, background: 'radial-gradient(circle, rgba(212,160,23,.35) 0%, transparent 70%)', animation: 'ins-halo 9s ease-in-out infinite' }} />
        <div className="ins-halo absolute rounded-full" style={{ width: 480, height: 480, bottom: -220, left: -200, background: 'radial-gradient(circle, rgba(249,115,22,.22) 0%, transparent 70%)', animation: 'ins-halo 11s ease-in-out infinite' }} />
        <div className="absolute inset-0" style={{ opacity: .05, backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Barre du haut */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link to="/" className="flex items-center gap-2.5 min-w-0" style={{ textDecoration: 'none' }}>
            <img src="/app-icon.svg" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" style={{ boxShadow: '0 4px 14px rgba(0,0,0,.25)' }} />
            <span className="text-white font-extrabold truncate">{ecole}</span>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="hidden sm:inline-flex items-center text-sm px-3 py-2" style={{ textDecoration: 'none', color: '#bfdbfe' }}>
              <i className="bi bi-arrow-left me-1.5" />Accueil
            </Link>
            <Link to="/login" className="inline-flex items-center text-sm font-bold px-4 py-2 rounded-full"
              style={{ textDecoration: 'none', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>
              Se connecter
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Colonne gauche : accroche, étapes, récapitulatif */}
          <aside className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="ins-monte inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.9)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#d4a017', boxShadow: '0 0 0 4px rgba(212,160,23,.25)' }} />
              Inscription en ligne · 5 minutes
            </div>
            <h1 className="ins-monte font-extrabold text-white m-0" style={{ animationDelay: '60ms', fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-.02em' }}>
              Votre permis<br />commence <span style={{ color: '#f0bb2a' }}>ici.</span>
            </h1>
            <p className="ins-monte text-blue-100 text-base sm:text-lg mt-4 mb-7 max-w-md" style={{ animationDelay: '120ms' }}>
              Choisissez votre formule, réglez l'acompte depuis votre téléphone : on s'occupe du reste.
            </p>

            <ol className="list-none p-0 space-y-3" style={{ margin: '0 0 1.75rem' }}>
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="ins-monte flex items-start gap-3.5" style={{ animationDelay: `${180 + i * 70}ms` }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: i === 0 ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : 'rgba(255,255,255,.1)', color: i === 0 ? '#0f2240' : '#f0bb2a', border: i === 0 ? 'none' : '1px solid rgba(255,255,255,.18)' }}>
                    <i className={`bi bi-${e.icon}`} />
                  </div>
                  <div className="pt-0.5">
                    <div className="text-white font-bold leading-tight">{e.titre}</div>
                    <div className="text-blue-200 text-sm">{e.texte}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="hidden lg:block ins-monte" style={{ animationDelay: '400ms' }}>{recap}</div>

            <div className="hidden lg:flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm text-blue-100">
              {["Agréée par l'État", 'Paiement en tranches', 'Suivi en ligne'].map(b => (
                <span key={b}><i className="bi bi-patch-check-fill me-1.5" style={{ color: '#4ade80' }} />{b}</span>
              ))}
            </div>
          </aside>

          {/* Colonne droite : le formulaire */}
          <main className="lg:col-span-7">
            <div className="bg-white rounded-[1.75rem] overflow-hidden ins-monte" style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,.45)', animationDelay: '120ms' }}>
              {fait ? (
                <div className="px-6 sm:px-10 py-12 text-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(22,163,74,.15)', animation: 'ins-halo 2.4s ease-in-out infinite' }} />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center text-4xl text-white"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 10px 24px rgba(22,163,74,.35)' }}>
                      <i className="bi bi-check-lg" />
                    </div>
                  </div>
                  <h2 className="mt-6 mb-2" style={{ color: '#0f2240', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 1.9rem)' }}>Merci {fait.prenom || ''} !</h2>
                  <p className="text-slate-600 max-w-md mx-auto">Votre demande est bien envoyée. Dès que {ecole} aura vérifié votre acompte,
                    vous recevrez vos identifiants de connexion par <b>WhatsApp</b>.</p>
                  <div className="max-w-sm mx-auto mt-7 text-left space-y-2.5">
                    {[['check-circle-fill', '#16a34a', 'Demande envoyée'], ['hourglass-split', '#d4a017', "Vérification de l'acompte"], ['whatsapp', '#25d366', 'Identifiants sur WhatsApp']].map(([ic, c, t], i) => (
                      <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: i === 0 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${i === 0 ? '#bbf7d0' : '#eef2f7'}` }}>
                        <i className={`bi bi-${ic}`} style={{ color: c, fontSize: '1.1rem' }} />
                        <span className="text-sm font-semibold text-slate-700">{t}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full text-sm font-bold text-white"
                    style={{ background: '#1e3a5f', textDecoration: 'none' }}>
                    <i className="bi bi-house" />Retour à l'accueil
                  </Link>
                </div>
              ) : (
                <form onSubmit={envoyer} className="relative" noValidate>
                  {/* Barre d'avancement */}
                  <div className="px-6 sm:px-8 pt-6 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold" style={{ color: '#0f2240' }}>Demande d'inscription</span>
                      <span className="text-xs font-bold" style={{ color: pct === 100 ? '#16a34a' : '#b45309' }}>{pct === 100 ? 'Prêt à envoyer' : `${pct} %`}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, background: 'linear-gradient(90deg,#d4a017,#f0bb2a)', transition: 'width .4s ease' }} />
                    </div>
                  </div>

                  <div className="px-6 sm:px-8 py-6 space-y-8">
                    {/* Champ piège : invisible pour une personne, rempli par les robots */}
                    <input type="text" name="site_web" tabIndex={-1} autoComplete="off" value={form.siteWeb} onChange={e => set('siteWeb', e.target.value)}
                      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />

                    <Section n={1} titre="Vos coordonnées" sous="Votre numéro deviendra votre identifiant" fait={faits.vous}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className={etiquette} htmlFor="ins-prenom">Prénom</label>
                          <input id="ins-prenom" className={champ} value={form.prenom} onChange={e => set('prenom', e.target.value)} autoComplete="given-name" placeholder="Ex. Aminata" /></div>
                        <div><label className={etiquette} htmlFor="ins-nom">Nom</label>
                          <input id="ins-nom" className={champ} value={form.nom} onChange={e => set('nom', e.target.value)} autoComplete="family-name" placeholder="Ex. Diop" /></div>
                        <div className="sm:col-span-2">
                          <label className={etiquette}>Téléphone (WhatsApp)</label>
                          <ChampTelephone className={champ} value={form.telephone} onChange={v => set('telephone', v)} />
                        </div>
                      </div>
                    </Section>

                    <Section n={2} titre="Votre formation" fait={faits.formation}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {FORMATIONS.map(f => {
                          const actif = form.formation === f.v
                          return (
                            <button key={f.v} type="button" onClick={() => choisirFormation(f.v)} aria-pressed={actif}
                              className="ins-tuile relative flex flex-col items-center gap-1 py-4 px-2 cursor-pointer text-center"
                              style={{ borderRadius: '1rem', border: `2px solid ${actif ? '#d4a017' : '#e8edf3'}`, background: actif ? 'linear-gradient(160deg,#fffbeb,#fef3c7)' : '#fff', color: '#1e3a5f' }}>
                              {actif && <i className="bi bi-check-circle-fill absolute top-2 right-2" style={{ color: '#d4a017' }} />}
                              <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-0.5"
                                style={{ background: actif ? '#1e3a5f' : '#f1f5f9', color: actif ? '#f0bb2a' : '#64748b' }}>
                                <i className={`bi bi-${f.icon}`} />
                              </span>
                              <span className="text-sm font-extrabold leading-tight">{f.titre}</span>
                              <span className="text-[11px] font-semibold text-slate-500">{f.sous}</span>
                            </button>
                          )
                        })}
                      </div>
                    </Section>

                    {formules.length > 0 && (
                      <Section n={3} titre="Votre formule" sous="Le prix et l'échéancier de votre formation" fait={faits.formule}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {formules.map(f => {
                            const actif = form.formule === f.cle
                            return (
                              <button key={f.cle} type="button" onClick={() => choisirFormule(f)} aria-pressed={actif}
                                className="ins-tuile relative flex flex-col items-start text-left p-4 cursor-pointer overflow-hidden"
                                style={{ borderRadius: '1.1rem', border: `2px solid ${actif ? '#1e3a5f' : '#e8edf3'}`, background: actif ? 'linear-gradient(150deg,#0f2240,#1e3a5f 60%,#2a4f7c)' : '#fff', color: actif ? '#fff' : '#1e3a5f' }}>
                                {actif && <i className="bi bi-check-circle-fill absolute top-3 right-3" style={{ color: '#f0bb2a', fontSize: '1.1rem' }} />}
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: actif ? '#f0bb2a' : '#94a3b8' }}>{f.titre}</span>
                                <span className="text-2xl font-extrabold leading-tight mt-1" style={{ color: actif ? '#fff' : '#0f2240' }}>{fcfa(f.montant)}</span>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {f.tranches.map((t, i) => (
                                    <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                      style={i === 0
                                        ? { background: actif ? '#f0bb2a' : '#fef3c7', color: actif ? '#0f2240' : '#92400e' }
                                        : { background: actif ? 'rgba(255,255,255,.14)' : '#f1f5f9', color: actif ? '#dbeafe' : '#475569' }}>
                                      {i === 0 ? `Acompte ${fcfa(t)}` : fcfa(t)}
                                    </span>
                                  ))}
                                  {f.tranches.length === 1 && <span className="text-[11px] font-semibold" style={{ color: actif ? '#bfdbfe' : '#94a3b8' }}>en une fois</span>}
                                </div>
                                {f.contenu?.length > 0 && (
                                  <ul className="mt-3 mb-0 p-0 list-none space-y-1">
                                    {f.contenu.map((c, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-[12.5px] font-semibold leading-snug" style={{ color: actif ? '#dbeafe' : '#334155' }}>
                                        <i className="bi bi-check2-circle mt-px" style={{ color: actif ? '#f0bb2a' : '#16a34a' }} />{c}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </Section>
                    )}

                    <Section n={formules.length > 0 ? 4 : 3} titre="Votre acompte" sous="Payez avec le bouton, puis indiquez le montant payé" fait={faits.acompte}>
                      <div className="grid grid-cols-2 gap-2.5 mb-3">
                        {[['WAVE', 'Wave', '#1dc8f2', '#0284c7', 'water'], ['ORANGE_MONEY', 'Orange Money', '#ff7900', '#c2410c', 'phone-fill']].map(([v, txt, vif, fonce, ic]) => {
                          const actif = form.moyenPaiement === v
                          return (
                            <button key={v} type="button" onClick={() => set('moyenPaiement', v)} aria-pressed={actif}
                              className="ins-tuile flex items-center justify-center gap-2.5 py-3.5 text-[15px] font-extrabold cursor-pointer"
                              style={{ borderRadius: '1rem', border: `2px solid ${actif ? vif : '#e8edf3'}`, background: actif ? `${vif}1a` : '#fff', color: actif ? fonce : '#64748b' }}>
                              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: actif ? vif : '#cbd5e1' }}><i className={`bi bi-${ic}`} /></span>
                              {txt}
                            </button>
                          )
                        })}
                      </div>
                      {lien && (
                        <a href={lien} target="_blank" rel="noopener noreferrer"
                          className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-[15px] font-extrabold text-white"
                          style={{ textDecoration: 'none', background: form.moyenPaiement === 'WAVE' ? '#1dc8f2' : '#ff7900', boxShadow: `0 8px 20px ${form.moyenPaiement === 'WAVE' ? 'rgba(29,200,242,.35)' : 'rgba(255,121,0,.35)'}` }}>
                          <i className="bi bi-box-arrow-up-right" />Payer {formule ? fcfa(acompte || formule.acompte) : "l'acompte"} avec {form.moyenPaiement === 'WAVE' ? 'Wave' : 'Orange Money'}
                        </a>
                      )}
                      <div><label className={etiquette} htmlFor="ins-montant">Montant payé</label>
                        <div className="relative"><input id="ins-montant" type="number" min="0" inputMode="numeric" className={champ} style={{ paddingRight: '3.5rem' }} placeholder="45000"
                          value={form.montantAcompte} onChange={e => set('montantAcompte', e.target.value)} />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span></div>
                        <div className="text-[11px] text-slate-400 mt-1">Payez depuis le numéro indiqué plus haut : l'auto-école retrouve ainsi votre paiement.</div></div>
                    </Section>

                    {/* Récapitulatif sur téléphone (sur ordinateur, il est dans la colonne de gauche) */}
                    {formule && (
                      <div className="lg:hidden rounded-2xl p-1" style={{ background: 'linear-gradient(135deg,#0f2240,#1e3a5f 60%,#2a4f7c)' }}>{recap}</div>
                    )}

                    {erreur && (
                      <div className="flex items-start gap-2 text-sm font-semibold rounded-xl px-4 py-3" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                        <i className="bi bi-exclamation-circle-fill mt-0.5" />{erreur}
                      </div>
                    )}
                  </div>

                  <div className="px-6 sm:px-8 pb-7">
                    <button type="submit" disabled={envoi}
                      className="w-full py-4 font-extrabold text-base border-0 cursor-pointer flex items-center justify-center gap-2"
                      style={{ borderRadius: 999, background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#0f2240', boxShadow: '0 10px 24px rgba(212,160,23,.4)', opacity: envoi ? .7 : 1 }}>
                      {envoi ? <><span className="spinner-border spinner-border-sm" />Envoi…</> : <>Envoyer ma demande d'inscription <i className="bi bi-arrow-right" /></>}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3 mb-0">
                      <i className="bi bi-shield-lock me-1" />Vos informations ne servent qu'à votre inscription chez {ecole}.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
