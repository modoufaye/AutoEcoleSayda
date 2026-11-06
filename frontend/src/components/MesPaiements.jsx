import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import { EnteteListe, Pastille, ListeVide, ListeChargement } from './ListeModerne'
import { toast } from './Toast'
import '../landing.css'

const TYPE_LABEL = {
  TRANCHE_1: '1re tranche (acompte)',
  TRANCHE_2: '2e tranche',
  TRANCHE_3: '3e tranche',
}

const STATUT_CFG = {
  PAYE:       { label: 'Payé',       bg: '#f0fdf4', color: '#16a34a', dot: '#16a34a' },
  EN_ATTENTE: { label: 'En attente', bg: '#fefce8', color: '#a16207', dot: '#ca8a04' },
  ANNULE:     { label: 'Annulé',     bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444' },
}

const MOYENS = {
  WAVE:         { label: 'Wave',         bg: '#1dc8ff', color: '#fff', icon: 'phone' },
  ORANGE_MONEY: { label: 'Orange Money', bg: '#ff7900', color: '#fff', icon: 'phone' },
}

const PAGE_SIZE = 10
const EMPTY_DECL = { moyenPaiement: '', montant: '' }

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#15803d] focus:bg-white transition-all"
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

export default function MesPaiements({ onBack }) {
  const { user } = useAuth()
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [liens, setLiens]         = useState({ WAVE: null, ORANGE_MONEY: null })
  const [decl, setDecl]           = useState(null) // formulaire « J'ai payé » ouvert ou non
  const [sending, setSending]     = useState(false)
  const [montantTotal, setMontantTotal] = useState(null) // prix de la formation, fixé par l'auto-école

  const load = () => api('GET', '/eleve/mes-paiements').then(setPaiements)

  useEffect(() => {
    load().finally(() => setLoading(false))
    api('GET', '/eleve/profil').then(p => setMontantTotal(p?.montantTotal ?? null)).catch(() => {})
    api('GET', '/config')
      .then(c => setLiens({ WAVE: c.lienWave || null, ORANGE_MONEY: c.lienOrangeMoney || null }))
      .catch(() => {})
  }, [])

  const moyensDispo = Object.keys(MOYENS).filter(k => liens[k])

  const ouvrirDeclaration = (moyen = '') => setDecl({ ...EMPTY_DECL, moyenPaiement: moyen })

  const declarer = async () => {
    const { moyenPaiement, montant } = decl
    if (!moyenPaiement || !montant) {
      toast('Veuillez remplir tous les champs', 'warning'); return
    }
    setSending(true)
    try {
      await api('POST', '/eleve/paiements/declarer', {
        moyenPaiement, montant: parseFloat(montant),
      })
      toast("Paiement déclaré — il sera validé par l'administration")
      setDecl(null); setPage(1); load()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSending(false) }
  }

  const total = paiements
    .filter(p => p.statut === 'PAYE')
    .reduce((s, p) => s + parseFloat(p.montant), 0)

  if (loading) return (
    <div className="bg-white rounded-2xl" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)' }}><ListeChargement /></div>
  )

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Bouton retour */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
            Retour
          </button>
        </div>
      )}

      {/* Bannière : bleu nuit souligné d'or, comme la caisse de l'auto-école */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 60%,#2a4f7c 100%)', borderBottom: '3px solid #d4a017', boxShadow: '0 8px 32px rgba(15,34,64,.25)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle,#d4a017,transparent)' }} />
        <div className="relative px-6 py-4 flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)' }}>
            <i className="bi bi-cash-stack" style={{ color: '#1e3a5f', fontSize: '1.3rem' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#f0bb2a' }}>Mes Paiements</div>
            <div className="text-xl font-extrabold text-white leading-tight truncate">{user?.nom}</div>
            {user?.email && <div className="text-sm mt-0.5" style={{ color: '#bfdbfe' }}>{user.email}</div>}
          </div>
          <div className="w-full sm:w-auto text-left sm:text-right flex-shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#bfdbfe' }}>Total payé</div>
            <div className="text-xl font-extrabold" style={{ color: '#86efac' }}>
              {total.toLocaleString('fr-FR')} <span className="text-sm font-semibold">FCFA</span>
            </div>
            {montantTotal != null && (
              <div className="text-xs font-semibold mt-1" style={{ color: '#bfdbfe' }}>
                sur {Number(montantTotal).toLocaleString('fr-FR')} · reste {Math.max(0, montantTotal - total).toLocaleString('fr-FR')} FCFA
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payer en ligne */}
      {moyensDispo.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="font-bold text-slate-800 text-sm">Payer en ligne</div>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            1. Payez avec le bouton ci-dessous. 2. Revenez ici et cliquez sur « J'ai payé » en indiquant
            le montant payé. L'administration validera votre paiement.
          </p>
          <div className="flex flex-wrap gap-2">
            {moyensDispo.map(k => (
              <a key={k} href={liens[k]} target="_blank" rel="noopener noreferrer"
                onClick={() => ouvrirDeclaration(k)}
                className="inline-flex items-center gap-2 px-5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ minHeight: 44, borderRadius: 999, textDecoration: 'none', background: MOYENS[k].bg, color: MOYENS[k].color }}>
                <i className={`bi bi-${MOYENS[k].icon}`} />
                Payer avec {MOYENS[k].label}
              </a>
            ))}
            <button onClick={() => ouvrirDeclaration(moyensDispo.length === 1 ? moyensDispo[0] : '')}
              className="inline-flex items-center gap-2 px-5 text-sm font-bold cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ minHeight: 44, borderRadius: 999, background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0' }}>
              <i className="bi bi-check2-circle" />
              J'ai payé
            </button>
          </div>
        </div>
      )}

      {/* Liste : bandeau bleu nuit souligné d'or, comme les autres pages */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="receipt" titre="Historique des paiements" sousTitre="Suivi de vos règlements" nombre={paiements.length} />

        {paiements.length === 0 ? (
          <ListeVide icone="cash-stack" texte="Aucun paiement enregistré" />
        ) : (
          <div>
            {paiements.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(p => {
              const cfg = STATUT_CFG[p.statut] || STATUT_CFG.PAYE
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors" style={{ borderBottom: '1.5px solid #dbe2ec' }}>

                  {/* Icône type */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                    <i className="bi bi-receipt-cutoff" style={{ color: '#f0bb2a', fontSize: '1rem' }} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{TYPE_LABEL[p.typePaiement] || p.typePaiement}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                      {p.moyenPaiement && MOYENS[p.moyenPaiement]
                        ? <><span>·</span><span className="truncate">{MOYENS[p.moyenPaiement].label}</span></>
                        : p.description && <><span>·</span><span className="truncate">{p.description}</span></>}
                    </div>
                  </div>

                  {/* Statut */}
                  <span className="flex-shrink-0"><Pastille couleur={cfg.color} fond={cfg.bg}>{cfg.label}</Pastille></span>

                  {/* Montant */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-800 text-sm">
                      {parseFloat(p.montant).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-xs text-slate-400">FCFA</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} setPage={setPage} total={paiements.length} pageSize={PAGE_SIZE} />
      </div>

      {/* Modal « J'ai payé » */}
      {decl && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem' }}>
              <div className="modal-header border-0 px-6 pt-5 pb-2">
                <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>Déclarer un paiement</h5>
                <button className="btn-close" onClick={() => setDecl(null)} />
              </div>
              <div className="modal-body px-6 py-4 space-y-3">
                <div>
                  <label className={labelCls}>Payé avec</label>
                  <select className={inputCls} value={decl.moyenPaiement}
                    onChange={e => setDecl(d => ({ ...d, moyenPaiement: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {moyensDispo.map(k => <option key={k} value={k}>{MOYENS[k].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Montant payé (FCFA)</label>
                  <input type="number" min="1" inputMode="numeric" className={inputCls} value={decl.montant}
                    placeholder="Ex : 50000"
                    onChange={e => setDecl(d => ({ ...d, montant: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2">
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                  onClick={() => setDecl(null)}>Annuler</button>
                <button className="btn fw-bold text-white px-5" disabled={sending}
                  style={{ background: 'linear-gradient(135deg,#14532d,#15803d)', borderRadius: '.75rem', border: 'none' }}
                  onClick={declarer}>
                  {sending ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-send me-1" />Envoyer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
