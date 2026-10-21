import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import { toast } from './Toast'
import '../landing.css'

const TYPE_LABEL = {
  TARIF_INSCRIPTION: 'Tarif inscription',
  TARIF_CODE:        'Tarif code',
  TARIF_CONDUITE:    'Tarif conduite',
  INSCRIPTION: 'Inscription',
  LECON:       'Leçon',
  EXAMEN:      'Examen',
  AUTRE:       'Autre',
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
const EMPTY_DECL = { moyenPaiement: '', typePaiement: '', montant: '', transactionId: '' }

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

  const load = () => api('GET', '/eleve/mes-paiements').then(setPaiements)

  useEffect(() => {
    load().finally(() => setLoading(false))
    api('GET', '/config')
      .then(c => setLiens({ WAVE: c.lienWave || null, ORANGE_MONEY: c.lienOrangeMoney || null }))
      .catch(() => {})
  }, [])

  const moyensDispo = Object.keys(MOYENS).filter(k => liens[k])

  const ouvrirDeclaration = (moyen = '') => setDecl({ ...EMPTY_DECL, moyenPaiement: moyen })

  const declarer = async () => {
    const { moyenPaiement, typePaiement, montant, transactionId } = decl
    if (!moyenPaiement || !typePaiement || !montant || !transactionId.trim()) {
      toast('Veuillez remplir tous les champs', 'warning'); return
    }
    setSending(true)
    try {
      await api('POST', '/eleve/paiements/declarer', {
        moyenPaiement, typePaiement, montant: parseFloat(montant), transactionId: transactionId.trim(),
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
    <div className="flex items-center justify-center py-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#14532d] rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Chargement…</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Bouton retour */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all"
          style={{ background: '#f1f5f9', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <i className="bi bi-arrow-left" />
          Retour
        </button>
      )}

      {/* Bannière */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#14532d 0%,#15803d 55%,#16a34a 100%)', boxShadow: '0 8px 32px rgba(20,83,45,.28)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle,#d4a017,transparent)' }} />
        <div className="relative px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-cash-stack" style={{ color: '#fff', fontSize: '1.3rem' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(187,247,208,.7)' }}>Mes Paiements</div>
            <div className="text-xl font-extrabold text-white leading-tight">{user?.nom}</div>
            {user?.email && <div className="text-sm mt-0.5" style={{ color: 'rgba(187,247,208,.85)' }}>{user.email}</div>}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(187,247,208,.8)' }}>Total payé</div>
            <div className="text-xl font-extrabold text-white">
              {total.toLocaleString('fr-FR')} <span className="text-sm font-semibold">FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payer en ligne */}
      {moyensDispo.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="font-bold text-slate-800 text-sm">Payer en ligne</div>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            1. Payez avec le bouton ci-dessous. 2. Revenez ici et cliquez sur « J'ai payé » en indiquant
            l'identifiant de transaction reçu par SMS. L'administration validera votre paiement.
          </p>
          <div className="flex flex-wrap gap-2">
            {moyensDispo.map(k => (
              <a key={k} href={liens[k]} target="_blank" rel="noopener noreferrer"
                onClick={() => ouvrirDeclaration(k)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold no-underline"
                style={{ background: MOYENS[k].bg, color: MOYENS[k].color }}>
                <i className={`bi bi-${MOYENS[k].icon}`} />
                Payer avec {MOYENS[k].label}
              </a>
            ))}
            <button onClick={() => ouvrirDeclaration(moyensDispo.length === 1 ? moyensDispo[0] : '')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-0 cursor-pointer"
              style={{ background: '#f0fdf4', color: '#15803d' }}>
              <i className="bi bi-check2-circle" />
              J'ai payé
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>

        <div className="px-5 py-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#14532d 0%,#15803d 100%)', borderBottom: '2px solid #14532d' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-receipt" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Historique des paiements</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(187,247,208,.85)' }}>Suivi de vos règlements</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {paiements.length}
          </span>
        </div>

        {paiements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <i className="bi bi-cash-stack" style={{ color: '#16a34a', fontSize: '1.5rem' }} />
            </div>
            <p className="text-slate-400 text-sm">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {paiements.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(p => {
              const cfg = STATUT_CFG[p.statut] || STATUT_CFG.PAYE
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">

                  {/* Icône type */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: '#f0fdf4' }}>
                    <i className="bi bi-receipt-cutoff" style={{ color: '#15803d', fontSize: '1rem' }} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{TYPE_LABEL[p.typePaiement] || p.typePaiement}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                      {p.moyenPaiement && MOYENS[p.moyenPaiement]
                        ? <><span>·</span><span className="truncate">{MOYENS[p.moyenPaiement].label} · {p.transactionId}</span></>
                        : p.description && <><span>·</span><span className="truncate">{p.description}</span></>}
                    </div>
                  </div>

                  {/* Statut */}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>

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
                  <label className={labelCls}>Objet du paiement</label>
                  <select className={inputCls} value={decl.typePaiement}
                    onChange={e => setDecl(d => ({ ...d, typePaiement: e.target.value }))}>
                    <option value="">Choisir…</option>
                    <option value="TARIF_INSCRIPTION">Tarif inscription</option>
                    <option value="TARIF_CODE">Tarif code</option>
                    <option value="TARIF_CONDUITE">Tarif conduite</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Montant payé (FCFA)</label>
                  <input type="number" min="1" inputMode="numeric" className={inputCls} value={decl.montant}
                    placeholder="Ex : 50000"
                    onChange={e => setDecl(d => ({ ...d, montant: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Identifiant de transaction</label>
                  <input className={inputCls} value={decl.transactionId}
                    placeholder="Reçu par SMS après le paiement"
                    onChange={e => setDecl(d => ({ ...d, transactionId: e.target.value }))} />
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
