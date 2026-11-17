import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useEcole } from '../ecole'
import { fmtMontant, waLink, ROLE_BASE } from '../utils'
import { EnteteListe } from './ListeModerne'
import SelecteurAnnee from './SelecteurAnnee'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const VERT = '#10b981'
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const COURT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
// Reliquats, du plus tranquille au plus urgent (couleurs d'état, toujours avec icône et libellé)
const TRANCHES = {
  solde:    { nom: 'Tout payé',            icone: 'check-circle-fill',        couleur: '#10b981', fond: '#ecfdf5' },
  moins50:  { nom: 'Moins de 50 000',       icone: 'hourglass-split',          couleur: '#f0bb2a', fond: '#fffbeb' },
  de50a100: { nom: '50 000 à 100 000',      icone: 'exclamation-circle-fill',  couleur: '#f97316', fond: '#fff7ed' },
  plus100:  { nom: 'Plus de 100 000',       icone: 'exclamation-triangle-fill', couleur: '#dc2626', fond: '#fef2f2' },
}
const ORDRE = ['solde', 'moins50', 'de50a100', 'plus100']

/* Montant court pour les axes : 1,2 M · 450 k */
const court = n => (n >= 1e6 ? `${(n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n))

function Tuile({ icone, couleur, titre, valeur, detail }) {
  return (
    <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#f8fafc', border: '1px solid #eef2f7' }}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: couleur, color: '#fff' }}><i className={`bi bi-${icone}`} /></span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{titre}</div>
        <div className="text-lg font-black truncate" style={{ color: ENCRE }}>{valeur}</div>
        {detail && <div className="text-xs text-slate-500 truncate">{detail}</div>}
      </div>
    </div>
  )
}

/* Tableau de bord (admin, secrétariat) : encaissements par mois (ou par année) et reliquats
   des élèves, répartis par montant restant, avec les plus gros à relancer par WhatsApp.
   masquer : montants cachés (bouton œil du tableau de bord, partage d'écran). */
export default function ArgentEcole({ masquer = false }) {
  // Clic sur un nom : la fiche de l'élève, comme depuis la liste
  const navigate = useNavigate()
  const { user } = useAuth()
  const ouvrirFiche = e => navigate(`${ROLE_BASE[user?.role] || '/dashboard'}/${e.perfectionnement ? 'perfectionnement' : 'eleves'}/${e.id}`)
  const ecole = useEcole()
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState(String(anneeCourante))
  const [d, setD] = useState(null)
  const [survol, setSurvol] = useState(null)
  const [W, setW] = useState(800)
  const boite = useRef(null)
  useEffect(() => {
    let vivant = true
    api('GET', `/dashboard/finances${annee ? `?annee=${annee}` : ''}`).then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
    return () => { vivant = false }
  }, [annee])
  useEffect(() => {
    const el = boite.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [d])
  // Téléphone : le détail reste affiché après le toucher ; il se ferme quand on touche ailleurs
  useEffect(() => {
    if (survol == null) return
    const fermer = ev => { if (!boite.current?.contains(ev.target)) setSurvol(null) }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [survol])
  if (!d) return null

  const m = n => (masquer ? '•••••• FCFA' : fmtMontant(Math.round(Number(n))))
  const parAnnee = !annee
  const enCours = Number(annee) === anneeCourante
  const nbMois = enCours ? new Date().getMonth() + 1 : 12
  const periodes = (parAnnee ? d.periodes : d.periodes.slice(0, nbMois)).map(p => ({ ...p, montant: Number(p.montant) }))
  const partiel = enCours ? periodes.length - 1 : -1          // mois en cours, pas fini
  const complets = periodes.filter((_, i) => i !== partiel)
  const moyenne = !parAnnee && complets.length ? complets.reduce((s, p) => s + p.montant, 0) / complets.length : null
  const meilleur = periodes.reduce((b, p, i) => (p.montant > (periodes[b]?.montant ?? -1) ? i : b), 0)
  const libelle = p => (parAnnee ? String(p.cle) : `${MOIS[p.cle - 1]} ${annee}`)
  const quand = parAnnee ? 'depuis le début' : `en ${annee}`

  // Barres des encaissements
  const etroit = W < 560, H = etroit ? 200 : 240
  const M = { t: 16, r: 8, b: 26, l: etroit ? 38 : 46 }
  const brut = Math.max(1, ...periodes.map(p => p.montant))
  const ordre = 10 ** Math.floor(Math.log10(brut))
  const pas = [1, 2, 2.5, 5, 10].map(k => k * ordre).find(v => brut / v <= 5) || ordre * 10
  const yMax = Math.ceil(brut / pas) * pas
  const colonne = (W - M.l - M.r) / Math.max(1, periodes.length)
  const barre = Math.min(34, Math.max(8, colonne * 0.6))
  const y = v => M.t + (1 - v / yMax) * (H - M.t - M.b)
  const graduations = Array.from({ length: Math.round(yMax / pas) + 1 }, (_, k) => k * pas)
  const xCentre = i => M.l + colonne * (i + 0.5)
  const s = survol != null ? periodes[survol] : null
  const tipGauche = s ? Math.min(Math.max(xCentre(survol) - 90, 0), W - 180) : 0

  // Reliquats
  const tranches = ORDRE.map(cle => ({ cle, ...TRANCHES[cle], ...(d.tranches.find(t => t.cle === cle) || { nombre: 0, montant: 0 }) }))
  const avecPrix = tranches.reduce((t, x) => t + x.nombre, 0)
  const rappel = e => `Bonjour ${e.nom.split(' ')[0]}, petit rappel de ${ecole.nom} : il reste ${fmtMontant(Math.round(Number(e.reste)))} à régler pour votre formation. Merci et à bientôt !`

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* ── Encaissements ─────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="cash-stack" titre="Encaissements" sousTitre={`${m(d.totalPeriode)} encaissés ${quand}`} />
        <div className="flex justify-end px-5 pt-4">
          <SelecteurAnnee annees={[String(anneeCourante), ...d.annees.map(String)]} valeur={annee}
            onChange={a => { setAnnee(a); setSurvol(null) }} avecToutes />
        </div>
        <div className="px-5 pb-5 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Tuile icone="cash-coin" couleur={VERT} titre={`Encaissé ${quand}`} valeur={m(d.totalPeriode)}
              detail={`${periodes.reduce((t, p) => t + p.nombre, 0)} paiement(s)`} />
            {moyenne != null
              ? <Tuile icone="calculator" couleur="#2a78d6" titre="Moyenne par mois" valeur={m(moyenne)} detail={enCours ? 'mois terminés' : `sur 12 mois`} />
              : <Tuile icone="calendar3" couleur="#2a78d6" titre="Années" valeur={String(periodes.length)} detail="avec des encaissements" />}
            <Tuile icone="trophy-fill" couleur="#f0bb2a" titre={parAnnee ? 'Meilleure année' : 'Meilleur mois'}
              valeur={periodes[meilleur]?.montant > 0 ? (parAnnee ? String(periodes[meilleur].cle) : MOIS[periodes[meilleur].cle - 1].replace(/^./, c => c.toUpperCase())) : '—'}
              detail={periodes[meilleur]?.montant > 0 ? m(periodes[meilleur].montant) : null} />
          </div>

          <div ref={boite} className="relative mt-4 select-none" style={{ WebkitTouchCallout: 'none' }} onContextMenu={e => e.preventDefault()}>
            {d.totalPeriode <= 0 ? (
              <div className="text-center text-sm text-slate-400 py-10">Aucun encaissement {quand}</div>
            ) : (
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Encaissements ${parAnnee ? 'par année' : 'par mois'}`}>
                {graduations.map(v => (
                  <g key={v}>
                    <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="#eef2f7" />
                    <text x={M.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{masquer && v ? '•••' : court(v)}</text>
                  </g>
                ))}
                {moyenne != null && moyenne > 0 && (
                  <g>
                    <line x1={M.l} x2={W - M.r} y1={y(moyenne)} y2={y(moyenne)} stroke="#2a78d6" strokeDasharray="5 4" strokeWidth="1.5" />
                    <text x={M.l + 4} y={y(moyenne) - 5} fontSize="10.5" fontWeight="700" fill="#2a78d6">moyenne</text>
                  </g>
                )}
                {periodes.map((p, i) => {
                  const h = y(0) - y(p.montant)
                  return (
                    <g key={p.cle}>
                      {survol === i && <rect x={M.l + colonne * i + 1} y={M.t} width={colonne - 2} height={H - M.t - M.b} rx="6" fill="#f1f5f9" />}
                      {p.montant > 0 && (
                        <rect x={xCentre(i) - barre / 2} y={y(p.montant)} width={barre} height={h} rx="4"
                          fill={i === partiel ? '#a7f3d0' : VERT} stroke={i === partiel ? VERT : 'none'} strokeDasharray={i === partiel ? '4 3' : undefined} />
                      )}
                      <text x={xCentre(i)} y={H - 8} textAnchor="middle" fontSize="11" fontWeight={survol === i ? 800 : 500} fill={survol === i ? ENCRE : '#94a3b8'}>
                        {parAnnee ? p.cle : COURT[p.cle - 1]}
                      </text>
                      <rect x={M.l + colonne * i} y={0} width={colonne} height={H} fill="transparent" style={{ cursor: 'pointer' }}
                        onPointerEnter={e => e.pointerType === 'mouse' && setSurvol(i)}
                        onPointerLeave={e => e.pointerType === 'mouse' && setSurvol(null)}
                        onClick={() => setSurvol(v => (v === i ? null : i))} />
                    </g>
                  )
                })}
              </svg>
            )}
            {s && (
              <div className="absolute top-0 pointer-events-none rounded-xl px-3 py-2 text-xs bg-white"
                style={{ left: tipGauche, width: 180, boxShadow: '0 8px 24px rgba(15,34,64,.18)', border: '1px solid #eef2f7' }}>
                <div className="font-extrabold" style={{ color: ENCRE }}>{libelle(s).replace(/^./, c => c.toUpperCase())}{survol === partiel ? ' (en cours)' : ''}</div>
                <div className="text-sm font-black mt-0.5" style={{ color: '#047857' }}>{m(s.montant)}</div>
                <div className="text-slate-500">{s.nombre} paiement{s.nombre > 1 ? 's' : ''}</div>
              </div>
            )}
          </div>
          {partiel >= 0 && <div className="text-[11px] text-slate-400 mt-1"><i className="bi bi-info-circle me-1" />Barre claire en pointillé : mois en cours, pas encore terminé.</div>}
        </div>
      </div>

      {/* ── Reliquats ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
        <EnteteListe icone="wallet2" titre="Reste à encaisser" sousTitre={`${d.elevesQuiDoivent} élève${d.elevesQuiDoivent > 1 ? 's' : ''} doivent encore payer`} />
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1px solid #fed7aa' }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f97316', color: '#fff' }}><i className="bi bi-piggy-bank-fill" /></span>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-black whitespace-nowrap" style={{ color: ENCRE }}>{m(d.totalReste)}</div>
              <div className="text-xs text-slate-600">à encaisser aujourd'hui, élèves en cours</div>
            </div>
          </div>

          {/* Barre empilée : élèves par montant restant */}
          {avecPrix > 0 && (
            <div className="flex h-3.5 rounded-full overflow-hidden gap-[2px]" role="img" aria-label="Élèves par montant restant">
              {tranches.filter(t => t.nombre > 0).map(t => (
                <div key={t.cle} style={{ width: `${100 * t.nombre / avecPrix}%`, background: t.couleur, transition: 'width .8s' }} title={`${t.nom} : ${t.nombre} élève(s)`} />
              ))}
            </div>
          )}
          {d.sansPrix > 0 && (
            <div className="text-[11px] text-slate-400 mt-3"><i className="bi bi-info-circle me-1" />{d.sansPrix} élève{d.sansPrix > 1 ? 's' : ''} sans prix de formation renseigné : non compté{d.sansPrix > 1 ? 's' : ''} ici.</div>
          )}
          </div>

          {/* Colonne de droite : élèves par montant restant */}
          {avecPrix > 0 && (
            <>
              {/* Téléphone : une ligne par tranche, nombre à droite ; plus large : cases 2 × 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 content-start">
                {tranches.map(t => {
                  const nombre = (
                    <span className="whitespace-nowrap">
                      <span className="text-lg font-black" style={{ color: ENCRE }}>{t.nombre}</span>
                      <span className="text-xs text-slate-500 ms-1.5">élève{t.nombre > 1 ? 's' : ''}</span>
                    </span>
                  )
                  return (
                    <div key={t.cle} className="rounded-xl px-3 py-2 flex items-center gap-3 sm:block" style={{ background: t.fond }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#334155' }}>
                          <i className={`bi bi-${t.icone}`} style={{ color: t.couleur }} />{t.nom}
                        </div>
                        <div className="hidden sm:block mt-0.5">{nombre}</div>
                        {t.cle !== 'solde' && t.nombre > 0 && <div className="text-[11px] text-slate-500">{m(t.montant)}</div>}
                      </div>
                      <div className="sm:hidden">{nombre}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* À relancer en priorité (sous les deux colonnes) : les plus gros reliquats, rappel WhatsApp prêt */}
          {d.aRelancer.length > 0 && (
            <div className="lg:col-span-2">
              <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2"><i className="bi bi-bell-fill me-1" style={{ color: '#f97316' }} />À relancer en priorité</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {d.aRelancer.map(e => {
                  const lien = waLink(e.telephone, rappel(e))
                  return (
                    <div key={e.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div className="flex-1 min-w-0">
                        <button type="button" onClick={() => ouvrirFiche(e)} title={`Ouvrir la fiche de ${e.nom}`}
                          className="block max-w-full text-left text-sm font-bold text-slate-800 truncate border-0 bg-transparent p-0 cursor-pointer hover:underline" style={{ color: ENCRE }}>
                          {e.nom}
                        </button>
                        <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-slate-500 leading-snug">
                          <b className="text-[13px] font-black whitespace-nowrap" style={{ color: '#c2410c' }}>reste {m(e.reste)}</b>
                          <span>payé {m(e.paye)} sur {m(e.total)}</span>
                        </div>
                      </div>
                      {lien && (
                        <a href={lien} target="_blank" rel="noreferrer" title="Envoyer un rappel sur WhatsApp" aria-label={`Rappel WhatsApp à ${e.nom}`}
                          className="w-8 h-8 flex items-center justify-center flex-shrink-0 no-underline" style={{ borderRadius: 999, background: '#25d366', color: '#fff' }}>
                          <i className="bi bi-whatsapp" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
