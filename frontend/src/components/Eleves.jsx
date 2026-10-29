import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, uploadFile, fetchBlob } from '../api'
import { fmtDate, fmtTime, fmtMontant, BADGES, LABELS, BUREAUX, waLink } from '../utils'
import { msgBienvenue } from '../messages'
import Badge from './Badge'
import { toast } from './Toast'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import PhotoPicker from './PhotoPicker'
import '../landing.css'

const PAGE_SIZE = 10

const DOCS = [
  { key: 'docCertResidence',  label: 'Certificat de résidence', type: 'CERT_RESIDENCE' },
  { key: 'docCniLegalisee',   label: 'Photocopie CNI légalisée', type: 'CNI' },
  { key: 'docGroupeSanguin',  label: 'Groupe sanguin', type: 'GROUPE_SANGUIN' },
  { key: 'docVisiteMedicale', label: 'Visite médicale', type: 'VISITE_MEDICALE' },
  { key: 'docPhotos',         label: '4 photos', type: 'PHOTO' },
  { key: 'docTimbre',         label: 'Timbre', type: 'TIMBRE' },
  { key: 'docEnrolement',     label: 'Enrôlement', type: 'ENROLEMENT' },
  { key: 'docDelivrance',     label: 'Délivrance', type: 'DELIVRANCE' },
]

const TYPES_PIECE = [
  { value: 'DOSSIER', label: "Dossier de l'élève (Service des Mines)" },
  ...DOCS.map(d => ({ value: d.type, label: d.label })),
  { value: 'AUTRE', label: 'Autre document' },
]
const typeLabel = t => TYPES_PIECE.find(x => x.value === t)?.label || 'Document'
const tailleLisible = o => o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1)} Mo`
const TAILLE_MAX = 10 * 1024 * 1024
const ACCEPT_PIECE = 'image/*,application/pdf'

const today = () => new Date().toISOString().split('T')[0]

const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', dateInscription: '', telephone: '',
  adresse: '', site: '', email: '', numeroCni: '', categoriePermis: '', statut: 'EN_COURS', moniteurId: '', photoUrl: '',
  montantAvance: '',
  docCertResidence: false, docCniLegalisee: false, docGroupeSanguin: false,
  docVisiteMedicale: false, docPhotos: false, docTimbre: false,
  docEnrolement: false, docDelivrance: false,
}

const STATUTS = [
  { value: 'EN_COURS',  label: 'En cours' },
  { value: 'DIPLOME',   label: 'Diplômé' },
  { value: 'SUSPENDU',  label: 'Suspendu' },
  { value: 'ABANDONNE', label: 'Abandonné' },
]


const STATUT_STYLE = {
  EN_COURS:  { bg: '#eff6ff', color: '#1d4ed8', label: 'En cours' },
  DIPLOME:   { bg: '#f0fdf4', color: '#15803d', label: 'Diplômé' },
  SUSPENDU:  { bg: '#fef9c3', color: '#a16207', label: 'Suspendu' },
  ABANDONNE: { bg: '#fef2f2', color: '#b91c1c', label: 'Abandonné' },
}

function age(d) {
  if (!d) return null
  const [y, m, dd] = d.split('-').map(Number)
  const t = new Date(); let a = t.getFullYear() - y
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < dd)) a--
  return a
}

function initials(nom = '', prenom = '') {
  return ((nom[0] || '') + (prenom[0] || '')).toUpperCase()
}

// Photo de profil si elle existe, sinon la pastille d'initiales (classes et styles inchangés).
function Avatar({ p, className, style }) {
  if (p.photoUrl) return <img src={p.photoUrl} alt="" className={`${className} flex-shrink-0`}
    style={{ objectFit: 'cover' }} />
  return <div className={`${className} flex items-center justify-center flex-shrink-0`} style={style}>{initials(p.nom, p.prenom)}</div>
}

/* ─── Onglet Leçons ─────────────────────────────────────── */
function TabLecons({ lecons }) {
  if (!lecons.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }} />
      <div className="mt-2 text-sm">Aucune leçon enregistrée</div>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-cards">
        <thead>
          <tr className="bg-slate-50">
            {['Date','Horaire','Type','Moniteur','Statut','Observations'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {lecons.map(l => (
            <tr key={l.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-500 cell-title">{fmtDate(l.date)}</td>
              <td className="px-4 py-3 text-slate-600" data-label="Horaire">{fmtTime(l.heureDebut)} – {fmtTime(l.heureFin)}</td>
              <td className="px-4 py-3" data-label="Type"><Badge value={l.type} map={BADGES.type_lecon} /></td>
              <td className="px-4 py-3 text-slate-500 text-xs" data-label="Moniteur">{l.moniteur ? `${l.moniteur.nom} ${l.moniteur.prenom}` : '—'}</td>
              <td className="px-4 py-3" data-label="Statut"><Badge value={l.statut} map={BADGES.statut_lecon} /></td>
              <td className="px-4 py-3 text-slate-400 text-xs" data-label="Observations">{l.observations || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Onglet Examens ────────────────────────────────────── */
function TabExamens({ examens }) {
  if (!examens.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <i className="bi bi-clipboard-x" style={{ fontSize: '2rem' }} />
      <div className="mt-2 text-sm">Aucun examen enregistré</div>
    </div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-cards">
        <thead>
          <tr className="bg-slate-50">
            {['Date','Type','Résultat','Score','Tentative','Observations'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {examens.map(e => (
            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-500 cell-title">{fmtDate(e.date)}</td>
              <td className="px-4 py-3" data-label="Type"><Badge value={e.type} map={BADGES.type_lecon} /></td>
              <td className="px-4 py-3" data-label="Résultat"><Badge value={e.resultat} map={BADGES.resultat} /></td>
              <td className="px-4 py-3 text-slate-600 font-medium" data-label="Score">{e.score != null ? `${e.score}/100` : '—'}</td>
              <td className="px-4 py-3 text-slate-400 text-xs" data-label="Tentative">#{e.tentative}</td>
              <td className="px-4 py-3 text-slate-400 text-xs" data-label="Observations">{e.observations || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Onglet Paiements ──────────────────────────────────── */
const EMPTY_PAY = { date: new Date().toISOString().slice(0,10), montant: '', typePaiement: '', statut: 'PAYE', description: '' }

function TabPaiements({ paiements, totalPaye, eleveId, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_PAY)
  const [saving, setSaving]     = useState(false)

  const save = async () => {
    if (!form.date || !form.montant || !form.typePaiement) { toast('Remplissez tous les champs obligatoires', 'warning'); return }
    setSaving(true)
    try {
      await api('POST', '/paiements', { ...form, eleveId, montant: parseFloat(form.montant) })
      toast('Versement ajouté')
      setShowForm(false); setForm(EMPTY_PAY)
      onRefresh()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  return (
    <>
      {/* En-tête : total + bouton ajouter */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold px-4 py-2 rounded-xl">
          <i className="bi bi-cash-coin" />
          Total encaissé : {fmtMontant(totalPaye)}
        </span>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-xl border-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
          <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'}`} />
          {showForm ? 'Annuler' : 'Nouveau versement'}
        </button>
      </div>

      {/* Formulaire inline */}
      {showForm && (
        <div className="mx-5 mb-3 p-4 rounded-xl" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
          <div className="row g-2">
            <div className="col-md-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date *</label>
              <input type="date" className="form-control form-control-sm" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Montant (FCFA) *</label>
              <input type="number" className="form-control form-control-sm" placeholder="0" value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Type *</label>
              <select className="form-select form-select-sm" value={form.typePaiement}
                onChange={e => setForm(f => ({ ...f, typePaiement: e.target.value }))}>
                <option value="">Choisir…</option>
                <option value="TARIF_INSCRIPTION">Tarif inscription</option>
                <option value="TARIF_CODE">Tarif code</option>
                <option value="TARIF_CONDUITE">Tarif conduite</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Statut</label>
              <select className="form-select form-select-sm" value={form.statut}
                onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                <option value="PAYE">Payé</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
            <div className="col-12">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
              <input className="form-control form-control-sm" placeholder="Optionnel" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button className="btn btn-sm fw-bold text-white px-4" disabled={saving}
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '.6rem', border: 'none' }}
                onClick={save}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" />Enregistrement…</> : <><i className="bi bi-check-lg me-1" />Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {paiements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <i className="bi bi-receipt-cutoff" style={{ fontSize: '2rem' }} />
          <div className="mt-2 text-sm">Aucun paiement enregistré</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-cards">
            <thead>
              <tr className="bg-slate-50">
                {['Réf.','Date','Type','Montant','Statut','Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paiements.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs cell-title">{p.reference}</td>
                  <td className="px-4 py-3 text-slate-500" data-label="Date">{fmtDate(p.date)}</td>
                  <td className="px-4 py-3" data-label="Type"><Badge value={p.typePaiement} map={BADGES.type_paiement} /></td>
                  <td className="px-4 py-3 font-semibold text-slate-700" data-label="Montant">{fmtMontant(p.montant)}</td>
                  <td className="px-4 py-3" data-label="Statut"><Badge value={p.statut} map={BADGES.statut_paiement} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs" data-label="Notes">{p.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* ─── Message de bienvenue WhatsApp ─────────────────────── */
/* Chaque envoi génère de nouveaux identifiants (création du compte ou nouveau mot de passe).
   WhatsApp s'ouvre depuis un lien de la fenêtre de confirmation et non directement après
   l'appel API : les navigateurs mobiles bloquent un window.open qui suit un await. */
function BienvenueWhatsApp({ eleve, ecole }) {
  const [loading, setLoading] = useState(false)
  const [creds, setCreds]     = useState(null)

  if (!waLink(eleve.telephone)) return null

  const generer = async () => {
    if (!eleve.email) { toast("Renseignez l'email de l'élève : il sert d'identifiant", 'warning'); return }
    if (!confirm(`Générer un nouveau mot de passe pour ${eleve.prenom} ?\nS'il avait déjà un compte, son ancien mot de passe ne fonctionnera plus.`)) return
    setLoading(true)
    try { setCreds(await api('POST', `/eleves/${eleve.id}/identifiants`)) }
    catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  const message = creds && msgBienvenue(eleve, ecole, creds)

  return (
    <div className="px-5 py-3 border-t border-slate-100">
      <button onClick={generer} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer"
        style={{ background: '#25d366', color: '#fff', opacity: loading ? .7 : 1 }}>
        {loading
          ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
          : <i className="bi bi-whatsapp" />}
        Message de bienvenue
      </button>

      {creds && (
        <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem' }}>
              <div className="modal-header border-0 px-6 pt-5 pb-2">
                <h5 className="modal-title fw-bold m-0" style={{ color: '#1e293b' }}>
                  {creds.compteCree ? 'Compte créé' : 'Nouveau mot de passe généré'}
                </h5>
                <button className="btn-close" onClick={() => setCreds(null)} />
              </div>
              <div className="modal-body px-6 py-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm mb-3">
                  <div>Identifiant : <code className="bg-white px-1 rounded">{creds.identifiant}</code></div>
                  <div className="mt-1">Mot de passe : <code className="bg-white px-1 rounded">{creds.motDePasse}</code></div>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Aperçu du message</div>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3" style={{ whiteSpace: 'pre-wrap' }}>{message}</div>
              </div>
              <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2">
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                  onClick={() => setCreds(null)}>Fermer</button>
                <a href={waLink(eleve.telephone, message)} target="_blank" rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setCreds(null), 300)}
                  className="btn fw-bold text-white px-4 d-inline-flex align-items-center gap-2"
                  style={{ background: '#25d366', borderRadius: '.75rem', border: 'none' }}>
                  <i className="bi bi-whatsapp" />Envoyer sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Compte élève ──────────────────────────────────────── */
/* Aperçu d'une pièce jointe (image ou PDF) dans une modale, sans quitter la fiche.
   Rendue dans <body> : elle peut s'ouvrir depuis une autre modale (formulaire élève).
   « Télécharger » reste là pour les navigateurs mobiles qui affichent mal un PDF intégré. */
function ApercuPiece({ eleveId, doc, onClose }) {
  const [url, setUrl] = useState(null)
  // Dernier onClose reçu, sans relancer le téléchargement quand le parent le recrée
  const fermer = useRef(onClose)
  useEffect(() => { fermer.current = onClose })

  useEffect(() => {
    let objUrl = null, annule = false
    fetchBlob(`/eleves/${eleveId}/documents/${doc.id}/fichier`)
      .then(b => { if (!annule) { objUrl = URL.createObjectURL(b); setUrl(objUrl) } })
      .catch(e => { if (!annule) { toast(e.message, 'danger'); fermer.current() } })
    return () => { annule = true; if (objUrl) URL.revokeObjectURL(objUrl) }
  }, [eleveId, doc.id])

  useEffect(() => {
    const echap = e => e.key === 'Escape' && fermer.current()
    document.addEventListener('keydown', echap)
    return () => document.removeEventListener('keydown', echap)
  }, [])

  const pdf = doc.contentType === 'application/pdf'
  return createPortal(
    <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-2xl" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <div className="modal-header border-0 px-5 py-3">
            <h5 className="modal-title fw-bold m-0 text-truncate" style={{ color: '#1e293b', fontSize: '1rem' }}>
              <i className={`bi bi-file-earmark-${pdf ? 'pdf-fill' : 'image-fill'} me-2`} style={{ color: pdf ? '#dc2626' : '#2563eb' }} />
              {doc.nomFichier}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body p-0 flex items-center justify-center" style={{ height: '75vh', background: '#f1f5f9' }}>
            {!url
              ? <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
              : pdf
                ? <iframe src={url} title={doc.nomFichier} className="w-100 h-100 border-0" />
                : <img src={url} alt={doc.nomFichier} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
          </div>
          <div className="modal-footer border-0 px-5 py-3 gap-2">
            {url && (
              <a href={url} download={doc.nomFichier} className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}>
                <i className="bi bi-download me-1" />Télécharger
              </a>
            )}
            <button className="btn fw-bold text-white px-4" style={{ background: '#1e3a5f', borderRadius: '.75rem' }}
              onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/*
 * Pièces jointes du dossier (image ou PDF).
 *  - eleveId fourni : envoi immédiat (modification, fiche élève) ;
 *  - eleveId absent (création) : les fichiers sont mis en attente dans `attente`,
 *    puis envoyés par le parent une fois l'élève créé.
 *  - seulDossier : uniquement le dossier Service des Mines (pas de choix de type, un seul fichier,
 *    un nouveau remplace l'ancien — côté serveur aussi).
 */
function PiecesJointes({ eleveId, attente = [], setAttente, onTypeAjoute, peutSupprimer, seulDossier = false }) {
  const [docs, setDocs]       = useState([])
  const [type, setType]       = useState('DOSSIER')
  const [envoi, setEnvoi]     = useState(false)
  const [apercu, setApercu]   = useState(null)

  useEffect(() => {
    if (!eleveId) return
    api('GET', `/eleves/${eleveId}/documents`).then(setDocs).catch(() => {})
  }, [eleveId])

  const choisir = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    const valides = files.filter(f => {
      if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) { toast(`${f.name} : image ou PDF uniquement`, 'warning'); return false }
      if (f.size > TAILLE_MAX) { toast(`${f.name} : 10 Mo maximum`, 'warning'); return false }
      return true
    })
    if (!valides.length) return
    onTypeAjoute?.(type)
    if (!eleveId) {
      setAttente(a => seulDossier ? [{ file: valides[0], type }] : [...a, ...valides.map(file => ({ file, type }))])
      return
    }
    setEnvoi(true)
    try {
      for (const f of valides) {
        const doc = await uploadFile(`/eleves/${eleveId}/documents`, f, { type })
        setDocs(d => [doc, ...(type === 'DOSSIER' ? d.filter(x => x.type !== 'DOSSIER') : d)])
      }
      toast(valides.length > 1 ? 'Fichiers ajoutés' : 'Fichier ajouté')
    } catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }

  const supprimer = async (doc) => {
    if (!confirm(`Supprimer « ${doc.nomFichier} » ?`)) return
    try { await api('DELETE', `/eleves/${eleveId}/documents/${doc.id}`); setDocs(d => d.filter(x => x.id !== doc.id)) }
    catch (e) { toast(e.message, 'danger') }
  }

  const lignes = eleveId
    ? docs.filter(d => !seulDossier || d.type === 'DOSSIER').map(d => ({ key: d.id, nom: d.nomFichier, type: d.type, taille: d.taille, pdf: d.contentType === 'application/pdf', doc: d }))
    : attente.map((a, i) => ({ key: i, nom: a.file.name, type: a.type, taille: a.file.size, pdf: a.file.type === 'application/pdf', idx: i }))

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {!seulDossier && (
          <select value={type} onChange={e => setType(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f]">
            {TYPES_PIECE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}
        <label className={`btn btn-sm fw-semibold text-white mb-0 ${envoi ? 'disabled' : ''}`}
          style={{ background: '#1e3a5f', borderRadius: '.65rem', whiteSpace: 'nowrap' }}>
          {envoi
            ? <><span className="spinner-border spinner-border-sm me-1" />Envoi…</>
            : seulDossier
              ? <><i className={`bi bi-${lignes.length ? 'arrow-repeat' : 'paperclip'} me-1`} />{lignes.length ? 'Remplacer le dossier' : 'Joindre le dossier'}</>
              : <><i className="bi bi-paperclip me-1" />Joindre un fichier</>}
          <input type="file" accept={ACCEPT_PIECE} multiple={!seulDossier} hidden onChange={choisir} disabled={envoi} />
        </label>
      </div>
      {lignes.length > 0 ? (
        <ul className="list-unstyled mb-0 mt-2 space-y-1.5">
          {lignes.map(l => (
            <li key={l.key} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5" style={{ border: '1px solid #e2e8f0' }}>
              <i className={`bi bi-file-earmark-${l.pdf ? 'pdf-fill' : 'image-fill'}`}
                style={{ color: l.pdf ? '#dc2626' : '#2563eb', fontSize: '1.1rem', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                {l.doc
                  ? <button type="button" onClick={() => setApercu(l.doc)}
                      className="block w-full text-left truncate text-sm font-semibold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0">{l.nom}</button>
                  : <div className="truncate text-sm font-semibold text-slate-700">{l.nom}</div>}
                <div className="text-xs text-slate-400">{typeLabel(l.type)} · {tailleLisible(l.taille)}{!l.doc && ' · envoyé à l\'enregistrement'}</div>
              </div>
              {(!l.doc || peutSupprimer) && (
                <button type="button" title="Retirer"
                  onClick={() => l.doc ? supprimer(l.doc) : setAttente(a => a.filter((_, i) => i !== l.idx))}
                  className="btn btn-sm btn-link text-danger p-1"><i className="bi bi-x-lg" /></button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0 mt-2" style={{ fontSize: '.75rem', color: '#94a3b8' }}>
          Photo ou scan (JPG, PNG, PDF — 10 Mo max). Sur téléphone, vous pouvez prendre la photo directement.
        </p>
      )}
      {apercu && <ApercuPiece eleveId={eleveId} doc={apercu} onClose={() => setApercu(null)} />}
    </div>
  )
}

/* Fiche élève (admin) : le dossier complet déposé au Service des Mines. Un seul fichier ;
   en envoyer un nouveau remplace l'ancien (côté serveur). */
function DossierEleve({ eleveId }) {
  const [dossier, setDossier] = useState(undefined)   // undefined = chargement, null = aucun
  const [envoi, setEnvoi]     = useState(false)
  const [apercu, setApercu]   = useState(false)

  useEffect(() => {
    api('GET', `/eleves/${eleveId}/documents`)
      .then(docs => setDossier(docs.find(d => d.type === 'DOSSIER') || null))
      .catch(() => setDossier(null))
  }, [eleveId])

  const choisir = async (e) => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) { toast('Image ou PDF uniquement', 'warning'); return }
    if (f.size > TAILLE_MAX) { toast('10 Mo maximum', 'warning'); return }
    if (dossier && !confirm(`Remplacer « ${dossier.nomFichier} » par « ${f.name} » ?`)) return
    setEnvoi(true)
    try {
      setDossier(await uploadFile(`/eleves/${eleveId}/documents`, f, { type: 'DOSSIER' }))
      toast(dossier ? 'Dossier remplacé' : 'Dossier ajouté')
    } catch (err) { toast(err.message, 'danger') }
    finally { setEnvoi(false) }
  }

  const bouton = (label, icon, style) => (
    <label className={`btn btn-sm fw-semibold mb-0 ${envoi ? 'disabled' : ''}`} style={{ borderRadius: '.65rem', whiteSpace: 'nowrap', ...style }}>
      {envoi ? <><span className="spinner-border spinner-border-sm me-1" />Envoi…</> : <><i className={`bi bi-${icon} me-1`} />{label}</>}
      <input type="file" accept={ACCEPT_PIECE} hidden onChange={choisir} disabled={envoi} />
    </label>
  )

  const pdf = dossier?.contentType === 'application/pdf'
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#fdf4ff' }}>
            <i className="bi bi-folder2-open" style={{ color: '#9333ea', fontSize: '.8rem' }} />
          </div>
          <div>
            <div className="font-bold text-slate-700 text-sm leading-tight">Dossier de l'élève</div>
            <div className="text-xs text-slate-400">Service des Mines</div>
          </div>
        </div>
        {dossier !== undefined && (
          <span style={{
            background: dossier ? '#f0fdf4' : '#fef9c3', color: dossier ? '#15803d' : '#a16207',
            border: `1px solid ${dossier ? '#86efac' : '#fde68a'}`,
            borderRadius: '.5rem', padding: '.15rem .5rem', fontSize: '.72rem', fontWeight: 700,
          }}>{dossier ? 'Fourni' : 'Manquant'}</span>
        )}
      </div>
      <div className="px-5 py-4">
        {dossier === undefined ? (
          <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin mx-auto" />
        ) : dossier ? (
          <>
            <div className="flex items-center gap-3">
              <i className={`bi bi-file-earmark-${pdf ? 'pdf-fill' : 'image-fill'}`}
                style={{ color: pdf ? '#dc2626' : '#2563eb', fontSize: '1.8rem', flexShrink: 0 }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-700">{dossier.nomFichier}</div>
                <div className="text-xs text-slate-400">
                  {tailleLisible(dossier.taille)} · ajouté le {fmtDate(dossier.dateAjout?.slice(0, 10))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setApercu(true)}
                className="btn btn-sm fw-semibold text-white flex-1" style={{ background: '#1e3a5f', borderRadius: '.65rem' }}>
                <i className="bi bi-eye-fill me-1" />Voir
              </button>
              {bouton('Remplacer', 'arrow-repeat', { background: '#f1f5f9', color: '#475569' })}
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-3">Aucun dossier joint pour le moment.</p>
            {bouton('Joindre le dossier', 'paperclip', { background: '#1e3a5f', color: '#fff' })}
            <p className="mb-0 mt-2" style={{ fontSize: '.72rem', color: '#94a3b8' }}>PDF ou photo, 10 Mo maximum</p>
          </div>
        )}
      </div>
      {apercu && dossier && <ApercuPiece eleveId={eleveId} doc={dossier} onClose={() => setApercu(false)} />}
    </div>
  )
}

function CompteEleveCard({ eleve }) {
  const [statut, setStatut]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creds, setCreds]     = useState(null)

  useEffect(() => {
    api('GET', `/eleves/${eleve.id}/compte`)
      .then(setStatut).catch(() => {}).finally(() => setLoading(false))
  }, [eleve.id])

  const creerCompte = async () => {
    setCreating(true)
    try {
      const res = await api('POST', `/eleves/${eleve.id}/creer-compte`)
      setCreds(res); setStatut({ compteActif: true, email: res.email })
      toast('Compte créé avec succès')
    } catch (e) { toast(e.message || 'Erreur création compte', 'danger') }
    finally { setCreating(false) }
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#eff6ff' }}>
          <i className="bi bi-person-lock" style={{ color: '#1e3a5f', fontSize: '.8rem' }} />
        </div>
        <span className="font-bold text-slate-700 text-sm">Compte élève</span>
      </div>
      <div className="px-5 py-4">
        {statut?.compteActif ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <i className="bi bi-check-circle-fill" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-700">Compte actif</div>
              <div className="text-xs text-slate-400">{statut.email}</div>
            </div>
          </div>
        ) : eleve.email ? (
          <>
            <div className="text-sm text-slate-400 mb-3 flex items-center gap-1.5">
              <i className="bi bi-info-circle" />Aucun compte créé
            </div>
            <button
              onClick={creerCompte} disabled={creating}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', border: 'none', cursor: creating ? 'not-allowed' : 'pointer' }}
            >
              {creating
                ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }}></span>Création…</>
                : <><i className="bi bi-person-plus" />Créer le compte</>}
            </button>
            {creds && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                <div className="font-bold text-emerald-700 mb-1">Identifiants créés</div>
                <div>Email : <code className="bg-white px-1 rounded">{creds.email}</code></div>
                <div className="mt-1">Mot de passe : <code className="bg-white px-1 rounded">{creds.motDePasse}</code></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400 flex items-center gap-1.5">
            <i className="bi bi-exclamation-triangle text-amber-500" />
            Renseignez un email pour créer un compte
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Eleves({ initialEleveId }) {
  const { user } = useAuth()
  const isMoniteur = user?.role === 'MONITEUR'

  const [list, setList]           = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [statut, setStatut]       = useState('')
  const [site, setSite]           = useState('')
  const [nouveauMois, setNouveauMois] = useState(false)
  const [archives, setArchives]   = useState(false)
  const loadReq = useRef(0)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(1)
  const [profileData, setProfileData] = useState({ lecons: [], examens: [], paiements: [], totalPaye: 0 })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('lecons')
  const [ecole, setEcole]         = useState('')
  const [piecesAttente, setPiecesAttente] = useState([])

  useEffect(() => {
    if (!isMoniteur) api('GET', '/config').then(c => setEcole(c.nom || '')).catch(() => {})
  }, [])

  const load = async () => {
    // Bascule rapide Actifs/Archivés : seule la dernière réponse doit s'afficher.
    const req = ++loadReq.current
    setLoading(true)
    try {
      const data = isMoniteur ? await api('GET', '/moniteur/mes-eleves') : await api('GET', `/eleves${archives ? '?archives=true' : ''}`)
      if (req !== loadReq.current) return
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement élèves', 'danger') }
    finally { if (req === loadReq.current) setLoading(false) }
    if (!isMoniteur) {
      try { setMoniteurs(await api('GET', '/moniteurs')) } catch { /* optionnel */ }
    }
  }

  useEffect(() => { load() }, [archives])

  useEffect(() => {
    if (!initialEleveId) return
    api('GET', `/eleves/${initialEleveId}`)
      .then(eleve => openProfile(eleve))
      .catch(() => toast('Élève introuvable', 'danger'))
  }, [initialEleveId])

  useEffect(() => {
    let r = list
    if (search.trim()) {
      const t = search.toLowerCase()
      r = r.filter(e => `${e.nom} ${e.prenom} ${e.telephone}`.toLowerCase().includes(t))
    }
    if (statut) r = r.filter(e => e.statut === statut)
    if (site) r = r.filter(e => e.site === site)
    if (nouveauMois) {
      const now = new Date()
      r = r.filter(e => {
        if (!e.dateInscription) return false
        const d = new Date(e.dateInscription)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
    }
    setFiltered(r)
    setPage(1)
  }, [search, statut, site, nouveauMois, list])

  const openProfile = async (eleve, initialTab = 'lecons') => {
    setSelected(eleve); setActiveTab(initialTab); setLoadingProfile(true)
    try {
      const [lecons, examens, paiements, tp] = await Promise.all([
        api('GET', `/eleves/${eleve.id}/lecons`),
        api('GET', `/eleves/${eleve.id}/examens`),
        api('GET', `/eleves/${eleve.id}/paiements`),
        api('GET', `/eleves/${eleve.id}/total-paye`),
      ])
      setProfileData({ lecons, examens, paiements, totalPaye: tp?.totalPaye ?? 0 })
    } catch { toast('Erreur chargement profil', 'danger') }
    finally { setLoadingProfile(false) }
  }

  const closeProfile = () => { setSelected(null); setProfileData({ lecons: [], examens: [], paiements: [], totalPaye: 0 }) }

  const changerStatut = async (id, newStatut) => {
    try {
      await api('PATCH', `/eleves/${id}/statut`, { statut: newStatut })
      toast('Statut mis à jour'); await load()
      if (selected?.id === id) setSelected(s => ({ ...s, statut: newStatut }))
    } catch (e) { toast(e.message, 'danger') }
  }

  const openModal = (eleve = null) => {
    if (eleve) {
      setEditId(eleve.id)
      setForm({ nom: eleve.nom, prenom: eleve.prenom, dateNaissance: eleve.dateNaissance,
        dateInscription: eleve.dateInscription || '',
        telephone: eleve.telephone, adresse: eleve.adresse || '', site: eleve.site || '', email: eleve.email || '',
        numeroCni: eleve.numeroCni || '', categoriePermis: eleve.categoriePermis, statut: eleve.statut,
        moniteurId: eleve.moniteur?.id || '', photoUrl: eleve.photoUrl || '',
        docCertResidence: eleve.docCertResidence || false,
        docCniLegalisee: eleve.docCniLegalisee || false,
        docGroupeSanguin: eleve.docGroupeSanguin || false,
        docVisiteMedicale: eleve.docVisiteMedicale || false,
        docPhotos: eleve.docPhotos || false,
        docTimbre: eleve.docTimbre || false,
        docEnrolement: eleve.docEnrolement || false,
        docDelivrance: eleve.docDelivrance || false,
      })
    } else { setEditId(null); setForm({ ...EMPTY, dateInscription: today() }) }
    setPiecesAttente([])
    setShowModal(true)
  }

  const save = async () => {
    const { nom, prenom, telephone, categoriePermis, dateNaissance, dateInscription, site } = form
    if (!nom || !prenom || !telephone || !categoriePermis || !dateNaissance || !dateInscription || !site) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    if (dateInscription > today()) {
      toast('La date d\'inscription ne peut pas être dans le futur', 'warning'); return
    }
    if (!editId && (!form.montantAvance || parseFloat(form.montantAvance) <= 0)) {
      toast('Le montant avancé à l\'inscription est obligatoire', 'warning'); return
    }
    const data = { ...form, adresse: form.adresse || null, email: form.email || null,
      numeroCni: form.numeroCni || null, photoUrl: form.photoUrl || null, moniteurId: form.moniteurId ? Number(form.moniteurId) : null,
      montantAvance: form.montantAvance ? parseFloat(form.montantAvance) : null }
    try {
      if (editId) {
        await api('PUT', `/eleves/${editId}`, data); toast('Élève modifié')
        setShowModal(false); await load()
        if (selected?.id === editId) setSelected(await api('GET', `/eleves/${editId}`))
      } else {
        const created = await api('POST', '/eleves', data)
        // L'élève existe : un échec d'envoi n'annule pas la création, on le signale seulement.
        let echecs = 0
        for (const p of piecesAttente) {
          try { await uploadFile(`/eleves/${created.id}/documents`, p.file, { type: p.type }) } catch { echecs++ }
        }
        toast(echecs ? `Élève créé, mais ${echecs} fichier(s) non envoyé(s) : ajoutez-les depuis sa fiche` : 'Élève créé',
          echecs ? 'warning' : undefined)
        setPiecesAttente([])
        setShowModal(false); await load()
        openProfile(created, 'paiements')
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  // Suppression définitive : seulement depuis les archives, et refusée par le serveur si l'élève a un historique.
  const del = async (id) => {
    if (!confirm('Supprimer cet élève DÉFINITIVEMENT ?\n\nPossible uniquement pour une fiche créée par erreur (sans paiement ni leçon).')) return
    try { await api('DELETE', `/eleves/${id}`); toast('Élève supprimé'); closeProfile(); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const archiver = async (eleve) => {
    if (!confirm(`Archiver ${eleve.prenom} ${eleve.nom} ?\n\nIl disparaît de la liste et ne peut plus se connecter. Ses paiements et son historique sont conservés : vous pourrez le réactiver à tout moment.`)) return
    try {
      const maj = await api('PATCH', `/eleves/${eleve.id}/archiver`)
      toast('Élève archivé'); await load()
      if (selected?.id === eleve.id) setSelected(maj)
    } catch (e) { toast(e.message, 'danger') }
  }

  const reactiver = async (eleve) => {
    try {
      const maj = await api('PATCH', `/eleves/${eleve.id}/reactiver`)
      toast(`${eleve.prenom} est de retour`); await load()
      if (selected?.id === eleve.id) setSelected(maj)
    } catch (e) { toast(e.message, 'danger') }
  }

  /* ── Modal ─────────────────────────────────────────────── */
  function Modal() {
    const inputCls = "w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
    const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
    return (
      <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>
            <div className="px-6 pt-6 pb-5 relative" style={{ background: 'linear-gradient(135deg,#142a47 0%,#1e3a5f 50%,#2a4f7c 100%)' }}>
              <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setShowModal(false)} />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,.2)' }}>
                  <i className="bi bi-person-plus-fill" style={{ fontSize: '1.6rem', color: '#fff' }} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>
                    {editId ? "Modifier l'élève" : 'Nouvel élève'}
                  </div>
                  {editId ? (
                    <>
                      <div className="text-2xl font-extrabold text-white leading-tight">
                        {form.nom} {form.prenom}
                      </div>
                      {form.telephone && <div className="text-sm mt-0.5" style={{ color: '#bfdbfe' }}>{form.telephone}</div>}
                    </>
                  ) : (
                    <div className="text-xl font-extrabold text-white leading-tight">Ajouter un élève</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-body px-6 py-4" style={{ background: '#f8fafc' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className={labelCls}>Photo de profil</label>
                  <PhotoPicker value={form.photoUrl} onChange={url => setForm(f => ({ ...f, photoUrl: url }))} />
                </div>
                {[
                  { key: 'nom',           label: 'Nom',             req: true,  type: 'text' },
                  { key: 'prenom',        label: 'Prénom',          req: true,  type: 'text' },
                  { key: 'dateNaissance', label: 'Date de naissance', req: true, type: 'date' },
                  { key: 'dateInscription', label: "Date d'inscription", req: true, type: 'date', max: today() },
                  { key: 'telephone',     label: 'Téléphone',       req: true,  type: 'text', ph: '7XXXXXXXX' },
                  { key: 'email',         label: 'Email',           req: false, type: 'email' },
                  { key: 'numeroCni',     label: 'Numéro CNI',      req: false, type: 'text' },
                ].map(f => (
                  <div key={f.key} className="col-md-6">
                    <label className={labelCls}>{f.label}{f.req && <span className="text-red-500 ml-0.5"> *</span>}</label>
                    <input type={f.type} className={inputCls} placeholder={f.ph || ''} max={f.max}
                      value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-md-6">
                  <label className={labelCls}>Catégorie de permis <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={form.categoriePermis}
                    onChange={e => setForm(fm => ({ ...fm, categoriePermis: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {[
                      { value: 'POIDS_LEGER',   label: 'Poids léger' },
                      { value: 'POIDS_LOURD',   label: 'Poids lourd' },
                      { value: 'TRANSPORT',     label: 'Transport' },
                      { value: 'C1',            label: 'C1' },
                      { value: 'INTERNATIONAL', label: 'International' },
                    ].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className={labelCls}>Bureau <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={form.site}
                    onChange={e => setForm(fm => ({ ...fm, site: e.target.value }))}>
                    <option value="">Choisir…</option>
                    {BUREAUX.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    {form.site && !BUREAUX.some(b => b.value === form.site) && (
                      <option value={form.site} disabled>{LABELS[form.site] || form.site}</option>
                    )}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className={labelCls}>Moniteur assigné</label>
                  <select className={inputCls} value={form.moniteurId}
                    onChange={e => setForm(fm => ({ ...fm, moniteurId: e.target.value }))}>
                    <option value="">— Aucun moniteur —</option>
                    {moniteurs.filter(m => m.actif).map(m => (
                      <option key={m.id} value={m.id}>{m.nom} {m.prenom}</option>
                    ))}
                  </select>
                </div>
                {editId && (
                  <div className="col-md-6">
                    <label className={labelCls}>Statut</label>
                    <select className={inputCls} value={form.statut}
                      onChange={e => setForm(fm => ({ ...fm, statut: e.target.value }))}>
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-12">
                  <label className={labelCls}>Adresse</label>
                  <input className={inputCls} value={form.adresse}
                    onChange={e => setForm(fm => ({ ...fm, adresse: e.target.value }))} />
                </div>
                {!editId && (
                  <div className="col-12">
                    <label className={labelCls}>
                      Montant avancé à l'inscription (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                      placeholder="Ex: 50000 FCFA"
                      value={form.montantAvance}
                      onChange={e => setForm(fm => ({ ...fm, montantAvance: e.target.value }))} />
                    <p className="text-xs text-slate-400 mt-1">
                      Un paiement de type <strong>Inscription</strong> sera automatiquement créé
                    </p>
                  </div>
                )}

                {/* Documents du dossier */}
                <div className="col-12">
                  <label className={labelCls}>Documents remis</label>
                  <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                    <div className="row g-2">
                      {DOCS.map(doc => (
                        <div key={doc.key} className="col-6">
                          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, color: form[doc.key] ? '#15803d' : '#64748b' }}>
                            <input
                              type="checkbox"
                              checked={form[doc.key]}
                              onChange={e => setForm(fm => ({ ...fm, [doc.key]: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#15803d', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span>
                              {form[doc.key] && <i className="bi bi-check-circle-fill me-1" style={{ color: '#15803d', fontSize: '.78rem' }} />}
                              {doc.label}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="mb-0 mt-2" style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                      {DOCS.filter(d => form[d.key]).length}/{DOCS.length} document{DOCS.filter(d => form[d.key]).length !== 1 ? 's' : ''} remis
                    </p>
                  </div>
                </div>

                {/* Dossier de l'élève (Service des Mines) : image ou PDF */}
                <div className="col-12">
                  <label className={labelCls}>Dossier de l'élève (Service des Mines)</label>
                  <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                    <PiecesJointes eleveId={editId} attente={piecesAttente} setAttente={setPiecesAttente}
                      peutSupprimer={!isMoniteur} seulDossier />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 px-6 pb-5 pt-2 gap-2" style={{ background: '#f8fafc' }}>
              <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn fw-bold text-white px-5" style={{
                background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none' }}
                onClick={save}>
                <i className="bi bi-check-lg me-1" />Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ══ VUE PROFIL ══════════════════════════════════════════ */
  if (selected) {
    const s = selected
    const st = STATUT_STYLE[s.statut] || { bg: '#f1f5f9', color: '#64748b', label: s.statut }

    return (
      <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Bannière */}
        <div className="rounded-2xl px-6 py-2 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #d4a017 0%, transparent 70%)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar p={s} className="w-9 h-9 rounded-xl text-sm font-extrabold"
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }} />
              <div>
                <div className="font-extrabold text-base leading-tight">{s.nom} {s.prenom}</div>
                {s.email && <div className="text-blue-200 text-xs">{s.email}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>{st.label}</span>
              {s.archive && (
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#e2e8f0', color: '#475569' }}>
                  <i className="bi bi-archive-fill me-1" />Archivé{s.dateArchivage ? ` le ${fmtDate(s.dateArchivage)}` : ''}
                </span>
              )}
              {s.site && <Badge value={s.site} map={BADGES.site} />}
              {!isMoniteur && s.archive && (
                <>
                  <button onClick={() => reactiver(s)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    style={{ background: '#d4a017', color: '#1e3a5f' }}>
                    <i className="bi bi-arrow-counterclockwise" />Réactiver
                  </button>
                  <button onClick={() => del(s.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5' }}>
                    <i className="bi bi-trash-fill" />Supprimer définitivement
                  </button>
                </>
              )}
              {!isMoniteur && !s.archive && (
                <>
                  <select className="text-xs font-semibold px-3 py-1.5 rounded-xl border-0 outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}
                    value={s.statut} onChange={e => changerStatut(s.id, e.target.value)}>
                    {STATUTS.map(st => <option key={st.value} value={st.value} style={{ color: '#1e293b' }}>{st.label}</option>)}
                  </select>
                  <button onClick={() => openModal(s)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                    <i className="bi bi-pencil-fill" />Modifier
                  </button>
                  <button onClick={() => archiver(s)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    style={{ background: 'rgba(255,255,255,.15)', color: '#fde68a' }}>
                    <i className="bi bi-archive-fill" />Archiver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Colonne gauche */}
          <div className="space-y-4">

            {/* Infos personnelles */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#eff6ff' }}>
                  <i className="bi bi-person-lines-fill" style={{ color: '#1e3a5f', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Informations</span>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Téléphone', value: s.telephone },
                  { label: 'Bureau',    value: s.site ? LABELS[s.site] : null },
                  { label: 'CNI',       value: s.numeroCni },
                  { label: 'Adresse',   value: s.adresse },
                  { label: 'Naissance', value: s.dateNaissance ? `${fmtDate(s.dateNaissance)} (${age(s.dateNaissance)} ans)` : null },
                  { label: 'Inscription', value: fmtDate(s.dateInscription) },
                  { label: 'Catégorie', value: s.categoriePermis },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-slate-700 font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ) : null)}
              </div>
              {!isMoniteur && !s.archive && <BienvenueWhatsApp eleve={s} ecole={ecole} />}
            </div>

            {/* Moniteur assigné */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#fef9c3' }}>
                  <i className="bi bi-person-badge-fill" style={{ color: '#ca8a04', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Moniteur assigné</span>
              </div>
              <div className="px-5 py-4">
                {s.moniteur ? (
                  <div className="flex items-center gap-3">
                    <Avatar p={s.moniteur} className="w-10 h-10 rounded-xl text-sm font-extrabold"
                      style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f' }} />
                    <div>
                      <div className="font-semibold text-sm text-slate-700">{s.moniteur.nom} {s.moniteur.prenom}</div>
                      {s.moniteur.telephone && <div className="text-xs text-slate-400">{s.moniteur.telephone}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 flex items-center gap-1.5 py-1">
                    <i className="bi bi-person-x" />Aucun moniteur assigné
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite — onglets */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)', minHeight: '480px' }}>
              {/* Onglets */}
              <div className="flex border-b border-slate-100 px-2 pt-2">
                {[
                  { key: 'lecons',    icon: 'journal-text',          label: 'Leçons',    count: profileData.lecons.length },
                  { key: 'examens',   icon: 'clipboard2-check-fill', label: 'Examens',   count: profileData.examens.length },
                  ...(!isMoniteur ? [{ key: 'paiements', icon: 'cash-stack', label: 'Paiements', count: profileData.paiements.length }] : []),
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-0 bg-transparent cursor-pointer transition-all"
                    style={{
                      color: activeTab === tab.key ? '#1e3a5f' : '#94a3b8',
                      borderBottom: activeTab === tab.key ? '2px solid #1e3a5f' : '2px solid transparent',
                    }}>
                    <i className={`bi bi-${tab.icon}`} />
                    {tab.label}
                    {!loadingProfile && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={activeTab === tab.key
                          ? { background: '#eff6ff', color: '#1e3a5f' }
                          : { background: '#f1f5f9', color: '#94a3b8' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {loadingProfile ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {activeTab === 'lecons'    && <TabLecons    lecons={profileData.lecons} />}
                  {activeTab === 'examens'   && <TabExamens   examens={profileData.examens} />}
                  {activeTab === 'paiements' && !isMoniteur && <TabPaiements paiements={profileData.paiements} totalPaye={profileData.totalPaye} eleveId={s.id} onRefresh={() => openProfile(s, 'paiements')} />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ligne du bas : Documents, Suivi formation, Compte élève */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Dossier de l'élève : le fichier déposé au Service des Mines (admin) */}
          {!isMoniteur && <DossierEleve key={`${s.id}-${showModal}`} eleveId={s.id} />}

          {/* Documents du dossier (vue moniteur) */}
          {isMoniteur && <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#fdf4ff' }}>
                  <i className="bi bi-folder2-open" style={{ color: '#9333ea', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Documents du dossier</span>
              </div>
              <span style={{
                background: DOCS.every(d => s[d.key]) ? '#f0fdf4' : '#fef9c3',
                color: DOCS.every(d => s[d.key]) ? '#15803d' : '#a16207',
                border: `1px solid ${DOCS.every(d => s[d.key]) ? '#86efac' : '#fde68a'}`,
                borderRadius: '.5rem', padding: '.15rem .5rem', fontSize: '.72rem', fontWeight: 700,
              }}>
                {DOCS.filter(d => s[d.key]).length}/{DOCS.length}
              </span>
            </div>
            <div className="px-5 py-3">
              <div className="row g-1">
                {DOCS.map(doc => (
                  <div key={doc.key} className="col-6">
                    <div className="flex items-center gap-1.5 py-1">
                      <i className={`bi bi-${s[doc.key] ? 'check-circle-fill' : 'circle'}`}
                        style={{ color: s[doc.key] ? '#15803d' : '#cbd5e1', fontSize: '.78rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '.78rem', color: s[doc.key] ? '#1e293b' : '#94a3b8', fontWeight: s[doc.key] ? 600 : 400 }}>
                        {doc.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Pièces jointes</div>
              <PiecesJointes key={`${s.id}-${showModal}`} eleveId={s.id} peutSupprimer={!isMoniteur} />
            </div>
          </div>}

          {/* Suivi formation */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <i className="bi bi-bar-chart-fill" style={{ color: '#16a34a', fontSize: '.8rem' }} />
              </div>
              <span className="font-bold text-slate-700 text-sm">Suivi de formation</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 text-center py-4">
              {[
                { val: s.nombreLeconsCode,      label: 'Code',     color: '#1e3a5f' },
                { val: s.nombreLeconsConduite,   label: 'Conduite', color: '#10b981' },
                { val: s.nombreLeconsCode + s.nombreLeconsConduite, label: 'Total', color: '#6366f1' },
              ].map(({ val, label, color }) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            {!loadingProfile && !isMoniteur && (
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Encaissé</span>
                <span className="text-sm font-bold text-emerald-600">{fmtMontant(profileData.totalPaye)}</span>
              </div>
            )}
          </div>

          {/* Compte élève */}
          {!isMoniteur && <CompteEleveCard eleve={s} />}
        </div>

        {showModal && Modal()}
      </div>
    )
  }

  /* ══ VUE LISTE ═══════════════════════════════════════════ */
  const colonnes = ['#','Nom & Prénom','Téléphone','Bureau','Moniteur','Catégorie','Leçons','Statut','Inscription',
    ...(archives ? ['Archivé le'] : []), '']
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      {!isMoniteur && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Élèves</h2>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} élève{filtered.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => openModal()}
            className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl border-0 cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
            <i className="bi bi-plus-lg" />Nouvel élève
          </button>
        </div>
      )}

      {/* Actifs / Archivés : deux onglets explicites (un simple bouton bascule ne montrait pas clairement
          dans quelle liste on se trouvait, ni comment en sortir). Les filtres s'appliquent à la liste affichée. */}
      {!isMoniteur && (
        <div className="flex gap-1 p-1 rounded-xl bg-slate-200/70 w-full sm:w-fit">
          {[
            { val: false, icon: 'people-fill', label: 'Élèves actifs' },
            { val: true,  icon: 'archive-fill', label: 'Archivés' },
          ].map(o => (
            <button key={o.label} onClick={() => setArchives(o.val)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-0 cursor-pointer transition-all"
              style={archives === o.val
                ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }
                : { background: 'transparent', color: '#64748b' }}>
              <i className={`bi bi-${o.icon}`} style={{ fontSize: '.85rem' }} />{o.label}
            </button>
          ))}
        </div>
      )}
      {archives && (
        <div className="flex items-center gap-3 flex-wrap rounded-xl px-4 py-3"
          style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#334155' }}>
          <i className="bi bi-archive-fill" />
          <span className="text-sm flex-1 min-w-48">Vous consultez les <strong>élèves archivés</strong>. Ils ne peuvent pas se connecter ; leur historique est conservé.</span>
          <button onClick={() => setArchives(false)}
            className="text-sm font-bold border-0 bg-transparent cursor-pointer p-0" style={{ color: '#1e3a5f' }}>
            <i className="bi bi-arrow-left me-1" />Retour aux élèves actifs
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 flex gap-3 flex-wrap" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-slate-50 border-2 rounded-xl px-3 py-2 focus-within:border-[#1e3a5f] transition-all" style={{ borderColor: '#e2e8f0' }}>
          <i className="bi bi-search text-slate-400" style={{ fontSize: '.9rem' }} />
          <input className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400"
            placeholder="Nom, prénom, téléphone…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="bg-slate-50 border-2 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:border-[#1e3a5f] transition-all cursor-pointer" style={{ borderColor: '#e2e8f0' }}
          value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          className="bg-slate-50 border-2 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:border-[#1e3a5f] transition-all cursor-pointer" style={{ borderColor: '#e2e8f0' }}
          value={site} onChange={e => setSite(e.target.value)}>
          <option value="">Tous les bureaux</option>
          {BUREAUX.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setNouveauMois(v => !v)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 cursor-pointer transition-all"
          style={nouveauMois
            ? { background: '#eff6ff', borderColor: '#3b82f6', color: '#2563eb' }
            : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
          <i className="bi bi-calendar-check" style={{ fontSize: '.85rem' }} />
          Nouveaux ce mois
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
        <div className="px-5 py-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#2a4f7c 100%)', borderBottom: '2px solid #142a47' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
            <i className="bi bi-people-fill" style={{ color: '#fff', fontSize: '.9rem' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{isMoniteur ? 'Mes Élèves' : archives ? 'Élèves archivés' : 'Liste des Élèves'}</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(147,197,253,.85)' }}>
              {filtered.length} élève{filtered.length > 1 ? 's' : ''} · suivi de formation
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            {filtered.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-cards">
            <thead>
              <tr className="bg-slate-50">
                {colonnes.map((h, i) => (
                  <th key={i} className={`px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === colonnes.length - 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={colonnes.length} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1e3a5f] rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={colonnes.length}>
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem' }} />
                    <div className="mt-2 text-sm font-medium">{archives ? 'Aucun élève archivé' : 'Aucun élève enregistré'}</div>
                  </div>
                </td></tr>
              ) : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((e, i) => {
                const st = STATUT_STYLE[e.statut] || { bg: '#f1f5f9', color: '#64748b', label: e.statut }
                return (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 text-xs cell-hide">{i + 1}</td>
                    <td className="px-4 py-3.5 cell-title">
                      <button className="text-left border-0 bg-transparent cursor-pointer p-0"
                        onClick={() => openProfile(e)}>
                        <div className="flex items-center gap-2.5">
                          <Avatar p={e} className="w-8 h-8 rounded-lg text-xs font-extrabold"
                            style={{ background: 'rgba(30,58,95,.08)', color: '#1e3a5f' }} />
                          <div>
                            <div className="font-semibold text-[#1e3a5f] text-sm hover:underline">{e.nom} {e.prenom}</div>
                            {e.email && <div className="text-xs text-slate-400">{e.email}</div>}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm" data-label="Téléphone">{e.telephone}</td>
                    <td className="px-4 py-3.5" data-label="Bureau">
                      {e.site ? <Badge value={e.site} map={BADGES.site} /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5" data-label="Moniteur">
                      {e.moniteur
                        ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                            {e.moniteur.nom} {e.moniteur.prenom}
                          </span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5" data-label="Catégorie">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {e.categoriePermis}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" data-label="Leçons">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span><i className="bi bi-book me-1" />{e.nombreLeconsCode}</span>
                        <span><i className="bi bi-car-front me-1" />{e.nombreLeconsConduite}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5" data-label="Statut">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs" data-label="Inscription">{fmtDate(e.dateInscription)}</td>
                    {archives && (
                      <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: '#475569' }} data-label="Archivé le">
                        {e.dateArchivage ? fmtDate(e.dateArchivage) : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-right cell-actions">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openProfile(e)} title="Voir profil"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                          style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                          <i className="bi bi-eye-fill" style={{ fontSize: '.8rem' }} />
                        </button>
                        {!isMoniteur && !e.archive && <>
                          <button onClick={() => openModal(e)} title="Modifier"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#f8fafc', color: '#64748b' }}>
                            <i className="bi bi-pencil-fill" style={{ fontSize: '.8rem' }} />
                          </button>
                          <button onClick={() => archiver(e)} title="Archiver"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#fefce8', color: '#a16207' }}>
                            <i className="bi bi-archive-fill" style={{ fontSize: '.8rem' }} />
                          </button>
                        </>}
                        {!isMoniteur && e.archive && <>
                          <button onClick={() => reactiver(e)} title="Réactiver"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#f0fdf4', color: '#15803d' }}>
                            <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '.85rem' }} />
                          </button>
                          <button onClick={() => del(e.id)} title="Supprimer définitivement"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all"
                            style={{ background: '#fef2f2', color: '#dc2626' }}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '.8rem' }} />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {showModal && Modal()}
    </div>
  )
}
