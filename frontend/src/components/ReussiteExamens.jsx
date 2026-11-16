import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { toast } from './Toast'
import { useEcole } from '../ecole'
import { EnteteListe } from './ListeModerne'
import SelecteurAnnee from './SelecteurAnnee'

const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }
const ENCRE = '#1e3a5f'
const TYPES = [
  { cle: 'code', nom: 'Code', titre: 'Examen du code', icone: 'signpost-split-fill', couleur: '#2a78d6', pale: '#bfd7f5' },
  { cle: 'conduite', nom: 'Conduite', titre: 'Examen de conduite', icone: 'car-front-fill', couleur: '#eb6834', pale: '#f8cdb7' },
]
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const COURT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
// Une phrase publique ne cite un taux qu'à partir de ce nombre de résultats (sinon « 100 % » sur 1 passage)
const MIN_PARTAGE = 10
const taux = (a, n) => (n > 0 ? Math.round(100 * a / n) : null)

/* Jauge en demi-cercle : la part admise, dans la couleur de l'examen. */
function Jauge({ valeur, couleur }) {
  const [trace, setTrace] = useState(false)
  useEffect(() => { const t = setTimeout(() => setTrace(true), 60); return () => clearTimeout(t) }, [])
  const r = 80, L = Math.PI * r
  return (
    <svg viewBox="0 0 200 112" className="w-full" style={{ maxWidth: 220 }} aria-hidden="true">
      <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="#eef2f7" strokeWidth="16" strokeLinecap="round" />
      {valeur != null && valeur > 0 && (
        <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke={couleur} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${trace ? L * valeur / 100 : 0} ${L}`} style={{ transition: 'stroke-dasharray 1s cubic-bezier(.2,.8,.2,1)' }} />
      )}
      <text x="100" y="88" textAnchor="middle" fontSize="40" fontWeight="900" fill={ENCRE}>{valeur ?? '—'}<tspan fontSize="20">{valeur != null ? ' %' : ''}</tspan></text>
    </svg>
  )
}

function CarteExamen({ type, b }) {
  const passes = b.admis + b.refuses
  const t = taux(b.admis, passes), t1 = taux(b.premierCoupAdmis, b.premierCoupPasses)
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center text-center" style={{ background: '#f8fafc', border: '1px solid #eef2f7' }}>
      <div className="flex items-center gap-2 self-start mb-1">
        <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: type.couleur, color: '#fff' }}><i className={`bi bi-${type.icone}`} /></span>
        <span className="font-extrabold text-sm" style={{ color: ENCRE }}>{type.titre}</span>
      </div>
      <Jauge valeur={t} couleur={type.couleur} />
      {passes === 0 ? (
        <div className="text-xs text-slate-400 -mt-1">Pas encore de résultat</div>
      ) : (
        <>
          <div className="text-sm text-slate-700 -mt-1"><b style={{ color: ENCRE }}>{b.admis}</b> admis sur <b style={{ color: ENCRE }}>{passes}</b> passage{passes > 1 ? 's' : ''}</div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {t1 != null && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white" style={{ color: ENCRE, border: '1px solid #e2e8f0' }}
                title={`${b.premierCoupAdmis} admis sur ${b.premierCoupPasses} premières tentatives`}>
                <i className="bi bi-lightning-charge-fill me-1" style={{ color: '#f0bb2a' }} />{t1} % du premier coup
              </span>
            )}
            {b.enAttente > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#f1f5f9', color: '#475569' }}>
                <i className="bi bi-hourglass-split me-1" />{b.enAttente} en attente
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* Tableau de bord (admin, secrétariat) : réussite aux examens du code et de la conduite —
   jauges, phrase à partager, et passages par mois (ou par année) : admis en couleur pleine,
   refusés en teinte claire au-dessus. Taux sur les résultats connus (les « en attente » à part). */
export default function ReussiteExamens() {
  const ecole = useEcole()
  const anneeCourante = new Date().getFullYear()
  const [annee, setAnnee] = useState(String(anneeCourante))
  const [d, setD] = useState(null)
  const [survol, setSurvol] = useState(null)
  const [W, setW] = useState(800)
  const boite = useRef(null)
  useEffect(() => {
    let vivant = true
    api('GET', `/dashboard/reussite${annee ? `?annee=${annee}` : ''}`).then(x => { if (vivant) setD(x) }).catch(() => { if (vivant) setD(null) })
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

  const parAnnee = !annee
  const enCours = Number(annee) === anneeCourante
  const periodes = d.periodes.slice(0, enCours ? new Date().getMonth() + 1 : undefined)
  const libelle = p => (parAnnee ? String(p.cle) : `${MOIS[p.cle - 1]} ${annee}`)
  const court = p => (parAnnee ? String(p.cle) : COURT[p.cle - 1])
  const passes = b => b.admis + b.refuses
  const connus = passes(d.code) + passes(d.conduite)
  const tCode = taux(d.code.admis, passes(d.code)), tConduite = taux(d.conduite.admis, passes(d.conduite))
  const quand = parAnnee ? 'depuis le début' : `en ${annee}`

  // Phrase à partager (réseaux sociaux, WhatsApp, affiche) : seulement les taux assez solides
  const morceaux = [passes(d.code) >= MIN_PARTAGE && `${tCode} % de réussite au code`, passes(d.conduite) >= MIN_PARTAGE && `${tConduite} % à la conduite`].filter(Boolean)
  const phrase = morceaux.length ? `${ecole.nom} : ${morceaux.join(' et ')} ${quand}.` : null
  const copier = async () => {
    try { await navigator.clipboard.writeText(phrase); toast('Phrase copiée : collez-la sur WhatsApp ou Facebook') }
    catch { toast('Copie impossible sur cet appareil', 'warning') }
  }

  // Barres : deux par période (code, conduite), hauteur = passages, admis en bas
  const etroit = W < 560, H = etroit ? 200 : 240
  const M = { t: 16, r: 8, b: 26, l: 30 }
  const brut = Math.max(4, ...periodes.flatMap(p => [passes(p.code), passes(p.conduite)]))
  const pas = brut <= 10 ? 2 : brut <= 25 ? 5 : brut <= 60 ? 10 : brut <= 150 ? 25 : 50
  const yMax = Math.ceil(brut / pas) * pas
  const colonne = (W - M.l - M.r) / Math.max(1, periodes.length)
  const barre = Math.min(18, Math.max(5, (colonne - 6) / 2 - 1))
  const y = v => M.t + (1 - v / yMax) * (H - M.t - M.b)
  const graduations = Array.from({ length: yMax / pas + 1 }, (_, k) => k * pas)
  const s = survol != null ? periodes[survol] : null
  const xCentre = i => M.l + colonne * (i + 0.5)
  const tipGauche = s ? Math.min(Math.max(xCentre(survol) - 95, 0), W - 190) : 0

  return (
    <div className="mt-3 bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone="award-fill" titre="Réussite aux examens" sousTitre={`${connus} résultat${connus > 1 ? 's' : ''} connu${connus > 1 ? 's' : ''} ${quand}`} />
      <div className="flex justify-end px-5 pt-4">
        <SelecteurAnnee annees={[String(anneeCourante), ...d.annees.map(String)]} valeur={annee}
          onChange={a => { setAnnee(a); setSurvol(null) }} avecToutes />
      </div>

      <div className="px-5 pb-5 pt-3">
        {/* Phrase à partager : l'argument face aux autres auto-écoles */}
        {phrase && (
          <div className="rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3"
            style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}>
            <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f0bb2a', color: ENCRE }}>
              <i className="bi bi-megaphone-fill" />
            </span>
            <div className="flex-1 min-w-[180px] text-sm text-slate-700 leading-snug">
              <b style={{ color: ENCRE }}>{phrase}</b>
              <div className="text-xs text-slate-500">À partager sur WhatsApp, Facebook ou sur une affiche.</div>
            </div>
            <button type="button" onClick={copier} className="px-3 py-1.5 text-xs font-bold border-0 cursor-pointer"
              style={{ borderRadius: 999, background: ENCRE, color: '#fff' }}>
              <i className="bi bi-clipboard me-1" />Copier
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TYPES.map(t => <CarteExamen key={t.cle} type={t} b={d[t.cle]} />)}
        </div>

        {/* Passages par période */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold" style={{ color: ENCRE }}>Passages {parAnnee ? 'par année' : 'par mois'}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {TYPES.map(t => (
              <span key={t.cle} className="inline-flex items-center gap-1.5">
                <span className="inline-flex"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.couleur }} /><span className="w-2.5 h-2.5 rounded-sm ms-0.5" style={{ background: t.pale }} /></span>
                {t.nom}
              </span>
            ))}
            <span className="text-slate-400">· foncé : admis · clair : refusés</span>
          </div>
        </div>
        <div ref={boite} className="relative mt-2 select-none" style={{ WebkitTouchCallout: 'none' }} onContextMenu={e => e.preventDefault()}>
          {connus === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">Aucun résultat d'examen {quand}</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Passages aux examens ${parAnnee ? 'par année' : 'par mois'}`}>
              {graduations.map(v => (
                <g key={v}>
                  <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="#eef2f7" />
                  <text x={M.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{v}</text>
                </g>
              ))}
              {periodes.map((p, i) => (
                <g key={p.cle}>
                  {survol === i && <rect x={M.l + colonne * i + 1} y={M.t} width={colonne - 2} height={H - M.t - M.b} rx="6" fill="#f1f5f9" />}
                  {TYPES.map((t, k) => {
                    const b = p[t.cle], x0 = xCentre(i) + (k ? 1 : -1 - barre)
                    const yA = y(b.admis), yT = y(passes(b)), base = y(0)
                    return (
                      <g key={t.cle}>
                        {b.refuses > 0 && <rect x={x0} y={yT} width={barre} height={Math.max(0, yA - yT - (b.admis ? 2 : 0))} rx="3" fill={t.pale} />}
                        {b.admis > 0 && <rect x={x0} y={yA} width={barre} height={base - yA} rx="3" fill={t.couleur} />}
                      </g>
                    )
                  })}
                  <text x={xCentre(i)} y={H - 8} textAnchor="middle" fontSize="11" fontWeight={survol === i ? 800 : 500} fill={survol === i ? ENCRE : '#94a3b8'}>{court(p)}</text>
                  {/* Zone de survol / toucher, plus large que les barres */}
                  <rect x={M.l + colonne * i} y={0} width={colonne} height={H} fill="transparent" style={{ cursor: 'pointer' }}
                    onPointerEnter={e => e.pointerType === 'mouse' && setSurvol(i)}
                    onPointerLeave={e => e.pointerType === 'mouse' && setSurvol(null)}
                    onClick={() => setSurvol(v => (v === i ? null : i))} />
                </g>
              ))}
            </svg>
          )}
          {s && (
            <div className="absolute top-0 pointer-events-none rounded-xl px-3 py-2 text-xs bg-white"
              style={{ left: tipGauche, width: 190, boxShadow: '0 8px 24px rgba(15,34,64,.18)', border: '1px solid #eef2f7' }}>
              <div className="font-extrabold mb-1" style={{ color: ENCRE }}>{libelle(s)[0].toUpperCase() + libelle(s).slice(1)}</div>
              {TYPES.map(t => {
                const b = s[t.cle], n = passes(b)
                return (
                  <div key={t.cle} className="flex items-center gap-1.5 py-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.couleur }} />
                    <span className="text-slate-600">{t.nom}</span>
                    <span className="ms-auto font-bold text-slate-800">{n ? `${b.admis}/${n} · ${taux(b.admis, n)} %` : '—'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-1"><i className="bi bi-info-circle me-1" />Taux calculé sur les résultats connus ; les examens en attente ne comptent pas.</div>
      </div>
    </div>
  )
}
