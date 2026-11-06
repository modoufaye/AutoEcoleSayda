import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, uploadFile, fetchBlob } from '../api'
import { fmtDate, fmtTime, fmtMontant, BADGES, LABELS, BUREAUX, LIEUX_INSCRIPTION, waLink, correspond, estAdmin } from '../utils'
import { msgBienvenue } from '../messages'
import Badge from './Badge'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import PhotoPicker from './PhotoPicker'
import '../landing.css'
import GrandePhoto from './GrandePhoto'
import ImportEleves from './ImportEleves'
import ChampTelephone from './ChampTelephone'
import { afficherTelephone } from '../telephones'
import { CoursPublies } from './SeanceCode'
import { compterSeances } from '../contenu/programme'
import { EnteteListe, LigneListe, AvatarRond, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, FiltreBascule, BoutonAjout } from './ListeModerne'

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

/* Formules proposées à l'inscription (Paramètres → Tarification), au format des tuiles de choix. */
const sepMille = n => Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ')
function optionsPermis(formules) {
  return (formules || []).filter(f => Number(f.montant) > 0).map(f => ({
    libelle: f.nom, titre: f.nom, montant: Number(f.montant), acompte: Number(f.acompte),
    detail: [f.acompte, f.tranche2, f.tranche3].filter(x => Number(x) > 0).map(sepMille).join(' + '),
  }))
}
function optionsPerfectionnement(formules, boite) {
  return (formules || []).filter(f => f.boite === boite && Number(f.montant) > 0).map(f => ({
    libelle: `${f.cours} cours · ${boite === 'AUTOMATIQUE' ? 'automatique' : 'manuelle'}`, titre: `${f.cours} cours`,
    montant: Number(f.montant), acompte: Number(f.acompte),
    detail: Number(f.tranche2) > 0 ? `${sepMille(f.acompte)} + ${sepMille(f.tranche2)}` : 'En une fois',
  }))
}

/* Tuiles de formule : un clic remplit le total et l'acompte (toujours modifiables) ; « Montant libre »
   garde la saisie manuelle. Élève déjà inscrit (verrouille) : seule sa formule s'affiche, les autres
   tuiles n'apparaissent qu'après « Changer de formule », pour éviter un changement par erreur. */
function ChoixFormule({ options, valeur, onChoisir, verrouille = false, total }) {
  const [ouvert, setOuvert] = useState(false)
  const tuile = actif => ({
    borderRadius: '.85rem', border: `2px solid ${actif ? '#d4a017' : '#e2e8f0'}`,
    background: actif ? '#fffbeb' : '#fff', color: '#1e3a5f', transition: 'all .15s',
  })
  if (verrouille && !ouvert) {
    const o = options.find(x => x.libelle === valeur)
    return (
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5" style={{ ...tuile(true), cursor: 'default' }}>
        <i className="bi bi-lock-fill text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold leading-tight">{o?.titre || valeur || 'Montant libre'}</div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
            {o ? `${sepMille(o.montant)} F · ${o.detail}` : total ? `${sepMille(total)} F` : 'Aucune formule choisie'}
          </div>
        </div>
        <button type="button" onClick={() => setOuvert(true)}
          className="px-3 py-1.5 text-xs font-bold cursor-pointer"
          style={{ borderRadius: '.6rem', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}>
          <i className="bi bi-pencil me-1" />Changer de formule
        </button>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map(o => (
        <button key={o.libelle} type="button" onClick={() => onChoisir(o)} aria-pressed={valeur === o.libelle}
          className="flex flex-col items-start text-left px-3 py-2.5 cursor-pointer" style={tuile(valeur === o.libelle)}>
          <span className="text-sm font-extrabold leading-tight">{o.titre}</span>
          <span className="text-base font-extrabold leading-tight mt-0.5" style={{ color: '#b45309' }}>{sepMille(o.montant)} F</span>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{o.detail}</span>
        </button>
      ))}
      <button type="button" onClick={() => onChoisir(null)} aria-pressed={!valeur}
        className="flex flex-col items-start justify-center text-left px-3 py-2.5 cursor-pointer" style={tuile(!valeur)}>
        <span className="text-sm font-extrabold leading-tight"><i className="bi bi-pencil me-1" />Montant libre</span>
        <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Saisie manuelle</span>
      </button>
    </div>
  )
}

const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', dateInscription: '', telephone: '',
  adresse: '', site: '', lieuInscription: '', numeroCni: '', categoriePermis: '', statut: 'EN_COURS', moniteurId: '', photoUrl: '',
  montantAvance: '', montantTotal: '', moyenAcompte: 'ESPECES', formule: '',
  // PERMIS (code + conduite) ou PERFECTIONNEMENT (conduite seule, boîte manuelle ou automatique)
  typeFormation: 'PERMIS', boiteVitesse: '',
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
    style={{ objectFit: 'cover', objectPosition: 'center 25%', border: style?.border }} />
  return <div className={`${className} flex items-center justify-center flex-shrink-0`} style={style}>{initials(p.nom, p.prenom)}</div>
}

/* ─── Onglet Leçons : cours publiés dans les séances, puis leçons planifiées ─── */
function TabLecons({ lecons, seances }) {
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#a16207' }}>
        <i className="bi bi-signpost-split-fill me-1" />Cours publiés ({seances.length})
      </div>
      <CoursPublies seances={seances} />
      <div className="px-4 pt-4 pb-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#475569', borderTop: '1px solid #eef2f7' }}>
        <i className="bi bi-calendar2-check-fill me-1" />Leçons planifiées ({lecons.length})
      </div>
      <TableLecons lecons={lecons} />
    </div>
  )
}
function TableLecons({ lecons }) {
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
              <td className="px-4 py-3 text-slate-500 text-xs" data-label="Moniteur">{l.moniteur ? `${l.moniteur.prenom} ${l.moniteur.nom}` : '—'}</td>
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
const EMPTY_PAY = { date: new Date().toISOString().slice(0,10), montant: '', statut: 'PAYE', description: '' }

/* Versements de l'élève : ajout, modification (formulaire prérempli) et suppression d'un
   versement saisi par erreur. Supprimer est réservé à l'admin, comme sur la page Paiements
   (refusé aussi par le serveur) ; le secrétariat peut modifier ou passer en « Annulé ». */
function TabPaiements({ paiements, totalPaye, montantTotal, eleveId, onRefresh, isAdmin }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_PAY)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)

  const total    = montantTotal != null ? Number(montantTotal) : null
  const acompte  = paiements.filter(p => p.typePaiement === 'TRANCHE_1' && p.statut === 'PAYE')
                            .reduce((s, p) => s + Number(p.montant), 0)
  const reliquat = total != null ? total - Number(totalPaye || 0) : null

  // Nouveau versement : le reliquat est proposé d'office ; la tranche est attribuée par le serveur.
  const ouvrirForm = () => {
    if (showForm) { setShowForm(false); setEditId(null); return }
    setEditId(null)
    setForm({ ...EMPTY_PAY, montant: reliquat > 0 ? String(reliquat) : '' })
    setShowForm(true)
  }
  const modifier = (p) => {
    setEditId(p.id)
    setForm({ date: p.date, montant: String(p.montant), statut: p.statut, description: p.description || '' })
    setShowForm(true)
  }
  const supprimer = async (p) => {
    const ok = await confirmer({ titre: 'Supprimer ce versement ?', ton: 'danger', libelle: 'Supprimer',
      details: [['Montant', fmtMontant(p.montant)], ['Date', fmtDate(p.date)], ['Référence', p.reference || '—']],
      message: "Il disparaîtra de la caisse et de la fiche de l'élève. Cette action est définitive." })
    if (!ok) return
    try { await api('DELETE', `/paiements/${p.id}`); toast('Versement supprimé'); if (editId === p.id) { setShowForm(false); setEditId(null) }; onRefresh() }
    catch (e) { toast(e.message, 'danger') }
  }

  const save = async () => {
    if (!form.date || !form.montant) { toast('Remplissez tous les champs obligatoires', 'warning'); return }
    setSaving(true)
    try {
      const data = { ...form, eleveId, montant: parseFloat(form.montant), description: form.description || null }
      if (editId) { await api('PUT', `/paiements/${editId}`, data); toast('Versement modifié') }
      else { await api('POST', '/paiements', data); toast('Versement ajouté') }
      setShowForm(false); setForm(EMPTY_PAY); setEditId(null)
      onRefresh()
    } catch (e) { toast(e.message, 'danger') }
    finally { setSaving(false) }
  }

  return (
    <>
      {/* Récapitulatif : total prévu, acompte, payé, reliquat */}
      <div className="px-5 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total prévu', val: total != null ? fmtMontant(total) : 'Non renseigné', color: '#1e3a5f', bg: '#eff6ff' },
          { label: 'Acompte',     val: fmtMontant(acompte),   color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Payé',        val: fmtMontant(totalPaye), color: '#047857', bg: '#ecfdf5' },
          { label: reliquat != null && reliquat < 0 ? 'Trop-perçu' : 'Reliquat',
            val: reliquat != null ? fmtMontant(Math.abs(reliquat)) : '—',
            color: reliquat > 0 ? '#b45309' : '#047857', bg: reliquat > 0 ? '#fffbeb' : '#ecfdf5' },
        ].map(c => (
          <div key={c.label} className="rounded-xl px-3 py-2.5 min-w-0" style={{ background: c.bg }}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
            <div className="text-[13px] sm:text-sm font-extrabold leading-tight" style={{ color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>
      {total == null && (
        <p className="px-5 pt-2 mb-0 text-xs text-slate-400">
          Renseignez le montant total de la formation avec « Modifier » pour suivre le reliquat.
        </p>
      )}

      <div className="px-5 pt-3 pb-2 flex items-center justify-end flex-wrap gap-2">
        <button onClick={ouvrirForm}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-xl border-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
          <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'}`} />
          {showForm ? 'Annuler' : 'Versement'}
        </button>
      </div>

      {/* Formulaire inline */}
      {showForm && (
        <div className="mx-5 mb-3 p-4 rounded-xl" style={{ background: editId ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${editId ? '#bfdbfe' : '#e2e8f0'}` }}>
          {editId && <div className="text-xs font-bold mb-2" style={{ color: '#1d4ed8' }}><i className="bi bi-pencil-fill me-1" />Modification du versement {paiements.find(p => p.id === editId)?.reference}</div>}
          <div className="row g-2">
            <div className="col-md-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date *</label>
              <input type="date" className="form-control form-control-sm" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="col-md-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Montant (FCFA) *</label>
              <input type="number" className="form-control form-control-sm" placeholder="0" value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
            </div>
            <div className="col-md-4">
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
                {['Date','Type','Montant','Statut',''].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider${h ? '' : ' sticky right-0 bg-slate-50'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paiements.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  {/* Référence sous la date et notes sous le type : moins de colonnes, boutons toujours visibles */}
                  <td className="px-4 py-3 text-slate-500 cell-title whitespace-nowrap">{fmtDate(p.date)}
                    <div className="text-[11px] text-slate-400 font-normal">{p.reference}</div></td>
                  <td className="px-4 py-3" data-label="Type"><Badge value={p.typePaiement} map={BADGES.type_paiement} />
                    {p.description && <div className="text-xs text-slate-400 mt-1">{p.description}</div>}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap" data-label="Montant">{fmtMontant(p.montant)}</td>
                  <td className="px-4 py-3" data-label="Statut"><Badge value={p.statut} map={BADGES.statut_paiement} /></td>
                  {/* Boutons accrochés au bord droit : visibles même si le tableau défile */}
                  <td className="px-3 py-3 sticky right-0 bg-white" data-label="" style={{ boxShadow: '-8px 0 8px -8px rgba(15,34,64,.15)' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => modifier(p)} title="Modifier ce versement"
                        className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: 999, background: '#eff6ff', color: '#2563eb' }}>
                        <i className="bi bi-pencil-fill" style={{ fontSize: '.75rem' }} />
                      </button>
                      {isAdmin && <button onClick={() => supprimer(p)} title="Supprimer ce versement"
                        className="w-8 h-8 flex items-center justify-center border-0 cursor-pointer" style={{ borderRadius: 999, background: '#fee2e2', color: '#b91c1c' }}>
                        <i className="bi bi-trash-fill" style={{ fontSize: '.75rem' }} />
                      </button>}
                    </div>
                  </td>
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
    if (!(await confirmer({ titre: `Nouveau mot de passe pour ${eleve.prenom} ?`, ton: 'alerte', icone: 'key-fill', libelle: 'Générer',
      message: "S'il avait déjà un compte, son ancien mot de passe ne fonctionnera plus. Vous pourrez ensuite lui envoyer ses identifiants par WhatsApp." }))) return
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
    if (!(await confirmer({ titre: 'Supprimer ce document ?', ton: 'danger', libelle: 'Supprimer', details: [['Fichier', doc.nomFichier]] }))) return
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
    if (dossier && !(await confirmer({ titre: 'Remplacer le dossier ?', ton: 'alerte', icone: 'arrow-repeat', libelle: 'Remplacer',
      details: [['Actuel', dossier.nomFichier], ['Nouveau', f.name]] }))) return
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

/* Fiche élève (admin, secrétariat) : les documents remis. Lecture seule ; « Modifier » permet de
   les cocher ou décocher (chaque clic est enregistré), « Terminé » reverrouille. */
function DocumentsRemis({ eleve, onMaj }) {
  const [envoi, setEnvoi] = useState(null)
  const [edition, setEdition] = useState(false)
  const nb = DOCS.filter(d => eleve[d.key]).length
  const basculer = async (d) => {
    setEnvoi(d.key)
    try { onMaj(await api('PATCH', `/eleves/${eleve.id}/documents-remis`, { [d.key]: !eleve[d.key] })) }
    catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(null) }
  }
  const complet = nb === DOCS.length
  return (
    <div className="bg-white rounded-2xl overflow-hidden lg:col-span-2" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#f0fdf4' }}>
            <i className="bi bi-card-checklist" style={{ color: '#15803d', fontSize: '.8rem' }} />
          </div>
          <div>
            <div className="font-bold text-slate-700 text-sm leading-tight">Documents remis</div>
            <div className="text-xs text-slate-400">{edition ? 'Cliquez sur un document pour le cocher ou le décocher' : 'Pièces du dossier fournies par l\'élève'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEdition(e => !e)} disabled={envoi !== null}
          className="px-2.5 py-1 text-xs font-bold cursor-pointer"
          style={edition
            ? { borderRadius: '.5rem', border: 'none', background: '#1e3a5f', color: '#fff' }
            : { borderRadius: '.5rem', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}>
          <i className={`bi bi-${edition ? 'check2' : 'pencil'} me-1`} />{edition ? 'Terminé' : 'Modifier'}
        </button>
        <span style={{
          background: complet ? '#f0fdf4' : '#fef9c3', color: complet ? '#15803d' : '#a16207',
          border: `1px solid ${complet ? '#86efac' : '#fde68a'}`,
          borderRadius: '.5rem', padding: '.15rem .5rem', fontSize: '.72rem', fontWeight: 700,
        }}>{nb}/{DOCS.length}</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {DOCS.map(d => {
          const ok = !!eleve[d.key]
          return (
            <button key={d.key} type="button" onClick={() => basculer(d)} disabled={!edition || envoi !== null} aria-pressed={ok}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold text-left ${edition ? 'cursor-pointer' : ''}`}
              style={{ borderRadius: '.75rem', border: `1.5px solid ${ok ? '#86efac' : '#e2e8f0'}`, cursor: edition ? 'pointer' : 'default',
                background: ok ? '#f0fdf4' : '#fff', color: ok ? '#15803d' : '#64748b', opacity: envoi && envoi !== d.key ? .6 : 1 }}>
              {envoi === d.key
                ? <span className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem' }} />
                : <i className={`bi bi-${ok ? 'check-circle-fill' : 'circle'}`} />}
              <span className="leading-tight">{d.label}</span>
            </button>
          )
        })}
      </div>
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
      setCreds(res); setStatut({ compteActif: true, identifiant: res.email })
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
              <div className="text-xs text-slate-400">Identifiant : {statut.identifiant}</div>
            </div>
          </div>
        ) : eleve.telephone ? (
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
                <div>Identifiant : <code className="bg-white px-1 rounded">{creds.email}</code></div>
                <div className="mt-1">Mot de passe : <code className="bg-white px-1 rounded">{creds.motDePasse}</code></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400 flex items-center gap-1.5">
            <i className="bi bi-exclamation-triangle text-amber-500" />
            Renseignez le téléphone pour créer un compte
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
// Mois courant au format « AAAA-MM », à l'heure locale
const MOIS_COURANT = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
// « 2026-10 » → « Octobre 2026 »
const libelleMois = (m) => {
  const [a, mo] = m.split('-').map(Number)
  const t = new Date(a, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export default function Eleves({ initialEleveId, onOuvrirEleve }) {
  const { user } = useAuth()
  const isMoniteur = user?.role === 'MONITEUR'
  // Suppression définitive (fiche, et pour un perfectionnement abandonné ses paiements) : admin seulement
  const isAdmin = estAdmin(user?.role)

  const [list, setList]           = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [statut, setStatut]       = useState('')
  const [site, setSite]           = useState('')
  // Mois d'inscription filtré, au format « AAAA-MM » ('' = tous les mois)
  const [moisInscription, setMoisInscription] = useState('')
  const [formation, setFormation] = useState('')   // '' | PERMIS | PERFECTIONNEMENT
  const [archives, setArchives]   = useState(false)
  const loadReq = useRef(0)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(1)
  const [profileData, setProfileData] = useState({ lecons: [], seances: [], examens: [], paiements: [], totalPaye: 0 })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('lecons')
  const [ecole, setEcole]         = useState('')
  const [moniteurDefaut, setMoniteurDefaut] = useState('')
  const [tarifs, setTarifs] = useState({ formules: [], formulesPerfectionnement: [] })
  const [piecesAttente, setPiecesAttente] = useState([])

  useEffect(() => {
    if (!isMoniteur) api('GET', '/config').then(c => {
      setEcole(c.nom || ''); setMoniteurDefaut(c.moniteurParDefautId ?? '')
      setTarifs({ formules: c.formules || [], formulesPerfectionnement: c.formulesPerfectionnement || [] })
    }).catch(() => {})
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
    // Onglet demandé à l'ouverture (ex. « paiements » après une inscription), transmis par l'historique.
    api('GET', `/eleves/${initialEleveId}`)
      .then(eleve => openProfile(eleve, window.history.state?.usr?.onglet || 'lecons'))
      .catch(() => toast('Élève introuvable', 'danger'))
  }, [initialEleveId])

  useEffect(() => {
    let r = list
    // Mots dans n'importe quel ordre : « awa diop » trouve DIOP Awa
    if (search.trim()) r = r.filter(e => correspond([e.prenom, e.nom, e.telephone], search))
    if (statut) r = r.filter(e => e.statut === statut)
    if (site) r = r.filter(e => e.site === site)
    if (moisInscription) r = r.filter(e => e.dateInscription?.startsWith(moisInscription))
    if (formation) r = r.filter(e => (e.typeFormation || 'PERMIS') === formation)
    // Derniers ajoutés en haut (ordre de création, pas la date d'inscription : un import peut être daté d'avant)
    setFiltered([...r].sort((a, b) => b.id - a.id))
    setPage(1)
  }, [search, statut, site, moisInscription, formation, list])

  // Mois où des élèves se sont inscrits, du plus récent au plus ancien, avec leur nombre
  const moisDisponibles = Object.entries(list.reduce((acc, e) => {
    const m = e.dateInscription?.substring(0, 7)
    if (m) acc[m] = (acc[m] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[0].localeCompare(a[0]))

  const openProfile = async (eleve, initialTab = 'lecons') => {
    setSelected(eleve); setActiveTab(initialTab); setLoadingProfile(true)
    try {
      const [lecons, seances, examens, paiements, tp] = await Promise.all([
        api('GET', `/eleves/${eleve.id}/lecons`),
        api('GET', `/eleves/${eleve.id}/seances`).catch(() => []),
        api('GET', `/eleves/${eleve.id}/examens`),
        api('GET', `/eleves/${eleve.id}/paiements`),
        api('GET', `/eleves/${eleve.id}/total-paye`),
      ])
      setProfileData({ lecons, seances, examens, paiements, totalPaye: tp?.totalPaye ?? 0 })
    } catch { toast('Erreur chargement profil', 'danger') }
    finally { setLoadingProfile(false) }
  }

  /* Fiche ouverte depuis la liste : on passe par l'adresse (…/eleves/42), qui empile une étape
     d'historique. Sinon le bouton Retour sautait la liste et revenait à la page d'avant. */
  const ouvrirFiche = (eleve) => onOuvrirEleve ? onOuvrirEleve(eleve.id) : openProfile(eleve)

  const closeProfile = () => { setSelected(null); setProfileData({ lecons: [], examens: [], paiements: [], totalPaye: 0 }) }

  const changerStatut = async (id, newStatut) => {
    try {
      const maj = await api('PATCH', `/eleves/${id}/statut`, { statut: newStatut })
      // Perfectionnement terminé : le serveur l'archive d'office
      toast(maj?.archive ? 'Formation terminée : élève archivé' : 'Statut mis à jour'); await load()
      if (selected?.id === id) setSelected(maj)
    } catch (e) { toast(e.message, 'danger') }
  }

  /* Perfectionnement abandonné : supprimé avec ses paiements et ses leçons (l'acompte sort de
     la caisse). Les autres élèves s'archivent ; seule une fiche sans historique se supprime. */
  const abandonPerf = (e) => isAdmin && e.typeFormation === 'PERFECTIONNEMENT' && e.statut === 'ABANDONNE' && !e.archive
  const supprimerAbandon = async (eleve) => {
    let paye = 0
    try { paye = Number((await api('GET', `/eleves/${eleve.id}/total-paye`))?.totalPaye || 0) } catch { /* montant indicatif */ }
    if (!(await confirmer({ titre: `Supprimer ${eleve.prenom} ${eleve.nom} ?`, ton: 'danger', libelle: 'Supprimer',
      message: `Perfectionnement abandonné : sa fiche, ses leçons et ses paiements${paye > 0 ? ` (${fmtMontant(paye)})` : ''} seront supprimés définitivement.${paye > 0 ? ' La caisse baisse d\'autant.' : ''}` }))) return
    try { await api('DELETE', `/eleves/${eleve.id}`); toast('Élève supprimé'); closeProfile(); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  // Formule choisie : total et acompte pré-remplis (l'acompte seulement à l'inscription)
  const choisirFormule = (o) => setForm(fm => o
    ? { ...fm, formule: o.libelle, montantTotal: String(o.montant), ...(editId ? {} : { montantAvance: String(o.acompte) }) }
    : { ...fm, formule: '' })

  const openModal = (eleve = null, typeFormation = 'PERMIS') => {
    if (eleve) {
      setEditId(eleve.id)
      setForm({ nom: eleve.nom, prenom: eleve.prenom, dateNaissance: eleve.dateNaissance || '',
        dateInscription: eleve.dateInscription || '',
        telephone: eleve.telephone || '', adresse: eleve.adresse || '', site: eleve.site || '',
        lieuInscription: eleve.lieuInscription || eleve.site || '',
        numeroCni: eleve.numeroCni || '', categoriePermis: eleve.categoriePermis, statut: eleve.statut,
        moniteurId: eleve.moniteur?.id || '', photoUrl: eleve.photoUrl || '',
        montantTotal: eleve.montantTotal ?? '', formule: eleve.formule || '',
        typeFormation: eleve.typeFormation || 'PERMIS', boiteVitesse: eleve.boiteVitesse || '',
        docCertResidence: eleve.docCertResidence || false,
        docCniLegalisee: eleve.docCniLegalisee || false,
        docGroupeSanguin: eleve.docGroupeSanguin || false,
        docVisiteMedicale: eleve.docVisiteMedicale || false,
        docPhotos: eleve.docPhotos || false,
        docTimbre: eleve.docTimbre || false,
        docEnrolement: eleve.docEnrolement || false,
        docDelivrance: eleve.docDelivrance || false,
      })
    } else {
      // Moniteur des cours de code (Paramètres), pré-sélectionné s'il est actif.
      const defaut = moniteurs.some(m => m.actif && String(m.id) === String(moniteurDefaut)) ? String(moniteurDefaut) : ''
      setEditId(null)
      setForm({ ...EMPTY, typeFormation, dateInscription: today(), moniteurId: typeFormation === 'PERMIS' ? defaut : '' })
    }
    setPiecesAttente([])
    setShowModal(true)
  }

  const save = async () => {
    // Téléphone obligatoire à l'inscription seulement : un élève importé sans numéro doit
    // rester modifiable (son compte se crée dès que le numéro est ajouté).
    const perf = form.typeFormation === 'PERFECTIONNEMENT'
    const manquants = [
      !form.nom && 'nom', !form.prenom && 'prénom', !editId && !form.telephone && 'téléphone',
      !perf && !form.categoriePermis && 'catégorie de permis', perf && !form.boiteVitesse && 'boîte de vitesses',
      !form.dateInscription && "date d'inscription",
      perf ? !form.lieuInscription && "lieu d'inscription" : !form.site && 'bureau',
    ].filter(Boolean)
    if (manquants.length) {
      toast(`Champ${manquants.length > 1 ? 's' : ''} obligatoire${manquants.length > 1 ? 's' : ''} : ${manquants.join(', ')}`, 'warning'); return
    }
    const { dateInscription } = form
    if (dateInscription > today()) {
      toast('La date d\'inscription ne peut pas être dans le futur', 'warning'); return
    }
    if (!editId && (!form.montantTotal || parseFloat(form.montantTotal) <= 0)) {
      toast('Le montant total de la formation est obligatoire', 'warning'); return
    }
    if (!editId && (!form.montantAvance || parseFloat(form.montantAvance) <= 0)) {
      toast('L\'acompte versé à l\'inscription est obligatoire', 'warning'); return
    }
    if (!editId && parseFloat(form.montantAvance) > parseFloat(form.montantTotal)) {
      toast('L\'acompte ne peut pas dépasser le montant total', 'warning'); return
    }
    const data = { ...form, adresse: form.adresse || null, dateNaissance: form.dateNaissance || null,
      lieuInscription: form.lieuInscription || null,
      numeroCni: form.numeroCni || null, photoUrl: form.photoUrl || null, moniteurId: form.moniteurId ? Number(form.moniteurId) : null,
      montantAvance: form.montantAvance ? parseFloat(form.montantAvance) : null,
      montantTotal: form.montantTotal !== '' ? parseFloat(form.montantTotal) : null,
      formule: form.formule || null,
      // Perfectionnement : catégorie B fixée par le serveur ; permis : pas de boîte
      categoriePermis: perf ? null : form.categoriePermis, boiteVitesse: perf ? form.boiteVitesse : null }
    try {
      if (editId) {
        const maj = await api('PUT', `/eleves/${editId}`, data)
        toast(maj?.archive && !selected?.archive && perf ? 'Formation terminée : élève archivé' : 'Élève modifié')
        setShowModal(false); await load()
        if (selected?.id === editId) setSelected(maj)
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
        if (onOuvrirEleve) onOuvrirEleve(created.id, 'paiements'); else openProfile(created, 'paiements')
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  // Suppression définitive : seulement depuis les archives, et refusée par le serveur si l'élève a un historique.
  const del = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer cet élève définitivement ?', ton: 'danger', libelle: 'Supprimer',
      message: "Possible uniquement pour une fiche créée par erreur (sans paiement ni leçon). Pour un élève qui a un historique, utilisez « Archiver »." }))) return
    try { await api('DELETE', `/eleves/${id}`); toast('Élève supprimé'); closeProfile(); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const archiver = async (eleve) => {
    if (!(await confirmer({ titre: `Archiver ${eleve.prenom} ${eleve.nom} ?`, ton: 'alerte', icone: 'archive-fill', libelle: 'Archiver',
      message: "Il disparaît de la liste et ne peut plus se connecter. Ses paiements et son historique sont conservés : vous pourrez le réactiver à tout moment." }))) return
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

  /* ── Fenêtre élève (inscription et modification) ── */
  function ModalModerne() {
    const inputCls = "w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-[#d4a017] transition-all"
    const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
    const set = (k, v) => setForm(fm => ({ ...fm, [k]: v }))
    const total = parseFloat(form.montantTotal) || 0
    const acompte = parseFloat(form.montantAvance) || 0
    // En modification : ce qui est déjà payé (fiche ouverte) remplace l'acompte saisi.
    const paye = editId ? (selected?.id === editId ? Number(profileData.totalPaye || 0) : 0) : acompte
    const pct = total > 0 ? Math.min(100, Math.round(paye / total * 100)) : 0
    const nbDocs = DOCS.filter(d => form[d.key]).length
    const PERMIS = [
      { v: 'A', icon: 'scooter',          txt: 'Moto' },
      { v: 'B', icon: 'car-front-fill',   txt: 'Voiture' },
      { v: 'C', icon: 'truck-front-fill', txt: 'Poids lourd' },
      { v: 'D', icon: 'bus-front-fill',   txt: 'Transport' },
    ]
    const MODES = [
      { v: 'ESPECES',      icon: 'cash-coin', txt: 'Espèces',      color: '#15803d', bg: '#dcfce7' },
      { v: 'WAVE',         icon: 'water',     txt: 'Wave',         color: '#0284c7', bg: '#e0f2fe' },
      { v: 'ORANGE_MONEY', icon: 'phone-fill', txt: 'Orange Money', color: '#ea580c', bg: '#ffedd5' },
    ]
    // Appelée comme fonction, pas comme composant : un composant redéfini à chaque rendu
    // serait remonté à chaque frappe et le champ perdrait le focus.
    const section = (n, icon, titre, children) => (
      <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ boxShadow: '0 1px 4px rgba(15,34,64,.06)', border: '1px solid #eef2f7' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{n}</span>
          <i className={`bi bi-${icon}`} style={{ color: '#1e3a5f' }} />
          <span className="font-extrabold text-slate-800">{titre}</span>
        </div>
        {children}
      </div>
    )
    const pill = (actif, extra = {}) => ({
      borderRadius: '.85rem', border: `2px solid ${actif ? (extra.color || '#1e3a5f') : '#e2e8f0'}`,
      background: actif ? (extra.bg || '#eff6ff') : '#fff', color: actif ? (extra.color || '#1e3a5f') : '#64748b',
      transition: 'all .15s',
    })
    const nomComplet = `${form.prenom} ${form.nom}`.trim()

    return (
      <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(6px)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0" style={{ borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
            {/* En-tête : aperçu de l'élève en cours de saisie */}
            <div className="px-6 pt-5 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 55%,#2a4f7c 100%)' }}>
              <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
              <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setShowModal(false)} />
              <div className="flex items-center gap-4">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="" className="w-16 h-16 rounded-full flex-shrink-0"
                    style={{ objectFit: 'cover', objectPosition: 'center 25%', border: '3px solid #f0bb2a' }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
                    style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                    {nomComplet ? initials(form.nom, form.prenom) : <i className="bi bi-person-plus-fill" />}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>{editId ? "Modifier l'élève" : 'Nouvelle inscription'}</div>
                  <div className="text-xl font-extrabold text-white leading-tight truncate">{nomComplet || 'Nouvel élève'}</div>
                  <div className="text-xs mt-1 flex flex-wrap gap-x-3" style={{ color: '#bfdbfe' }}>
                    {form.categoriePermis && <span><i className="bi bi-award me-1" />Permis {form.categoriePermis}</span>}
                    {form.site && <span><i className="bi bi-geo-alt me-1" />{LABELS[form.site]}</span>}
                    {total > 0 && <span><i className="bi bi-cash-stack me-1" />{fmtMontant(total)}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-body px-4 sm:px-6 py-5 space-y-4" style={{ background: '#f4f6fa' }}>
              {section(1, "person-vcard", "Identité", <>
                <div className="mb-3"><PhotoPicker value={form.photoUrl} onChange={url => set('photoUrl', url)} /></div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className={labelCls}>Prénom <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.prenom} onChange={e => set('prenom', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Téléphone {!editId && <span className="text-red-500">*</span>}</label>
                    <ChampTelephone className={inputCls} value={form.telephone} onChange={v => set('telephone', v)} />
                    <div className="text-[11px] text-slate-400 mt-1">Sert d'identifiant de connexion à l'élève</div>
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Date de naissance</label>
                    <input type="date" className={inputCls} value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Adresse</label>
                    <input className={inputCls} placeholder="Quartier, ville" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
                  </div>
                </div>
              </>)}

              {section(2, "mortarboard", "Formation", <>
                <label className={labelCls}>Permis <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PERMIS.map(p => (
                    <button key={p.v} type="button" onClick={() => set('categoriePermis', p.v)}
                      className="flex flex-col items-center py-3 cursor-pointer" style={pill(form.categoriePermis === p.v)}>
                      <i className={`bi bi-${p.icon}`} style={{ fontSize: '1.4rem' }} />
                      <span className="text-lg font-extrabold leading-none mt-1">{p.v}</span>
                      <span className="text-[10px] font-semibold mt-0.5 hidden sm:block">{p.txt}</span>
                    </button>
                  ))}
                </div>
                <div className="row g-3">
                  <div className={editId ? 'col-12' : 'col-md-6'}>
                    <label className={labelCls}>Date d'inscription <span className="text-red-500">*</span></label>
                    <input type="date" className={inputCls} max={today()} value={form.dateInscription} onChange={e => set('dateInscription', e.target.value)} />
                  </div>
                  {editId && (
                    <div className="col-md-6">
                      <label className={labelCls}>Statut</label>
                      <select className={inputCls} value={form.statut} onChange={e => set('statut', e.target.value)}>
                        {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className={labelCls}>Moniteur</label>
                    <select className={inputCls} value={form.moniteurId} onChange={e => set('moniteurId', e.target.value)}>
                      <option value="">— Aucun moniteur —</option>
                      {moniteurs.filter(m => m.actif).map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Lieu d'inscription</label>
                    <div className="flex flex-wrap gap-2">
                      {LIEUX_INSCRIPTION.map(l => (
                        <button key={l.value} type="button"
                          onClick={() => setForm(fm => ({ ...fm, lieuInscription: l.value,
                            // Inscription : en ligne → Massalikoul Djinane, sinon le bureau suit le lieu.
                            // Modification : le bureau de suivi ne change pas.
                            site: editId ? fm.site : l.value === 'EN_LIGNE' ? (fm.site || 'MAZALIK_JINAN') : l.value }))}
                          className="px-3 py-2 text-sm font-semibold cursor-pointer" style={pill(form.lieuInscription === l.value)}>
                          {l.value === 'EN_LIGNE' && <i className="bi bi-globe2 me-1" />}{l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-12">
                    <label className={labelCls}>Bureau de suivi <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {BUREAUX.map(b => (
                        <button key={b.value} type="button" onClick={() => set('site', b.value)}
                          className="px-3 py-2 text-sm font-semibold cursor-pointer" style={pill(form.site === b.value)}>
                          <i className="bi bi-building me-1" />{b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}

              {section(3, "wallet2", "Paiement", <>
                {optionsPermis(tarifs.formules).length > 0 && <div className="mb-3">
                  <label className={labelCls}>Formule</label>
                  <ChoixFormule options={optionsPermis(tarifs.formules)} valeur={form.formule} onChoisir={choisirFormule}
                    verrouille={!!editId} total={parseFloat(form.montantTotal) || 0} />
                </div>}
                <div className="row g-3">
                  <div className={editId ? 'col-12' : 'col-md-6'}>
                    <label className={labelCls}>Prix de la formation {!editId && <span className="text-red-500">*</span>}</label>
                    <div className="relative">
                      <input type="number" min="0" className={inputCls} style={{ paddingRight: '3.5rem' }} placeholder="150000"
                        value={form.montantTotal} onChange={e => set('montantTotal', e.target.value)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span>
                    </div>
                  </div>
                  {!editId && <div className="col-md-6">
                    <label className={labelCls}>Acompte versé <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="number" min="0" className={inputCls} style={{ paddingRight: '3.5rem' }} placeholder="50000"
                        value={form.montantAvance} onChange={e => set('montantAvance', e.target.value)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span>
                    </div>
                  </div>}
                  {!editId && <div className="col-12">
                    <label className={labelCls}>Mode de règlement</label>
                    <div className="grid grid-cols-3 gap-2">
                      {MODES.map(m => (
                        <button key={m.v} type="button" onClick={() => set('moyenAcompte', m.v)}
                          className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold cursor-pointer"
                          style={pill(form.moyenAcompte === m.v, m)}>
                          <i className={`bi bi-${m.icon}`} /><span className="truncate">{m.txt}</span>
                        </button>
                      ))}
                    </div>
                  </div>}
                </div>
                {/* Récapitulatif en direct */}
                <div className="mt-4 rounded-xl p-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                  <div className="grid grid-cols-3 text-center">
                    {[['Total', total, '#fff'], [editId ? 'Déjà payé' : 'Acompte', paye, '#86efac'], ['Reliquat', Math.max(0, total - paye), '#fcd34d']].map(([l, v, c]) => (
                      <div key={l}>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#93c5fd' }}>{l}</div>
                        <div className="text-sm sm:text-base font-extrabold" style={{ color: c }}>{fmtMontant(v)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)', transition: 'width .3s' }} />
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: '#bfdbfe' }}>
                    {editId ? `${pct} % payé · les versements se gèrent dans l'onglet Paiements de la fiche`
                      : acompte > total && total > 0 ? "⚠️ L'acompte dépasse le prix" : `${pct} % payé · l'acompte devient la 1re tranche`}
                  </div>
                </div>
              </>)}

              {section(4, "folder2-open", "Dossier", <>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls + ' mb-0'}>Documents remis</label>
                  <span className="text-xs font-bold" style={{ color: nbDocs === DOCS.length ? '#15803d' : '#94a3b8' }}>{nbDocs}/{DOCS.length}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DOCS.map(doc => (
                    <button key={doc.key} type="button" onClick={() => set(doc.key, !form[doc.key])}
                      className="px-3 py-1.5 text-xs font-semibold cursor-pointer"
                      style={{ ...pill(form[doc.key], { color: '#15803d', bg: '#dcfce7' }), borderRadius: '999px' }}>
                      <i className={`bi bi-${form[doc.key] ? 'check-circle-fill' : 'circle'} me-1`} />{doc.label}
                    </button>
                  ))}
                </div>
                <label className={labelCls}>Dossier Service des Mines</label>
                <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1' }}>
                  <PiecesJointes eleveId={editId} attente={piecesAttente} setAttente={setPiecesAttente}
                    peutSupprimer={!isMoniteur} seulDossier />
                </div>
              </>)}
            </div>

            <div className="modal-footer border-0 px-6 py-3 flex items-center justify-between gap-2" style={{ background: '#fff', borderTop: '1px solid #eef2f7' }}>
              <div className="text-xs text-slate-500 hidden sm:block">
                {total > 0 ? <>Reliquat à percevoir : <strong className="text-slate-700">{fmtMontant(Math.max(0, total - paye))}</strong></> : 'Les champs * sont obligatoires'}
              </div>
              <div className="flex gap-2 ms-auto">
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.85rem' }} onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn fw-bold px-4" onClick={save}
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.85rem', border: 'none', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
                  <i className="bi bi-check2-circle me-1" />{editId ? 'Enregistrer' : "Inscrire l'élève"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Perfectionnement : sa propre fenêtre, réduite à l'essentiel
  const fenetreEleve = () => form.typeFormation === 'PERFECTIONNEMENT' ? ModalPerfectionnement() : ModalModerne()

  /* ── Fenêtre « Perfectionnement » : conduite seule (boîte manuelle ou automatique).
     Prénom, nom, téléphone, date et lieu d'inscription, total, acompte et reliquat : pas de
     catégorie de permis, de moniteur, de bureau ni de dossier. Le bureau suit le lieu. ── */
  function ModalPerfectionnement() {
    const inputCls = "w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-[#d4a017] transition-all"
    const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
    const set = (k, v) => setForm(fm => ({ ...fm, [k]: v }))
    const total = parseFloat(form.montantTotal) || 0
    const acompte = parseFloat(form.montantAvance) || 0
    // En modification : ce qui est déjà payé (fiche ouverte) remplace l'acompte saisi.
    const paye = editId ? (selected?.id === editId ? Number(profileData.totalPaye || 0) : 0) : acompte
    const pct = total > 0 ? Math.min(100, Math.round(paye / total * 100)) : 0
    const BOITES = [
      { v: 'MANUELLE',    icon: 'gear-wide-connected',   txt: 'Manuelle',    sous: 'Boîte de vitesses manuelle' },
      { v: 'AUTOMATIQUE', icon: 'lightning-charge-fill', txt: 'Automatique', sous: 'Boîte de vitesses automatique' },
    ]
    const MODES = [
      { v: 'ESPECES',      icon: 'cash-coin', txt: 'Espèces',      color: '#15803d', bg: '#dcfce7' },
      { v: 'WAVE',         icon: 'water',     txt: 'Wave',         color: '#0284c7', bg: '#e0f2fe' },
      { v: 'ORANGE_MONEY', icon: 'phone-fill', txt: 'Orange Money', color: '#ea580c', bg: '#ffedd5' },
    ]
    // Appelées comme fonctions (voir ModalModerne) : le champ garde le focus à chaque frappe.
    const section = (n, icon, titre, children) => (
      <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ boxShadow: '0 1px 4px rgba(15,34,64,.06)', border: '1px solid #eef2f7' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>{n}</span>
          <i className={`bi bi-${icon}`} style={{ color: '#1e3a5f' }} />
          <span className="font-extrabold text-slate-800">{titre}</span>
        </div>
        {children}
      </div>
    )
    const montant = (key, ph) => (
      <div className="relative">
        <input type="number" min="0" className={inputCls} style={{ paddingRight: '3.5rem' }} placeholder={ph}
          value={form[key]} onChange={e => set(key, e.target.value)} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">FCFA</span>
      </div>
    )
    const pill = (actif, extra = {}) => ({
      borderRadius: '.85rem', border: `2px solid ${actif ? (extra.color || '#1e3a5f') : '#e2e8f0'}`,
      background: actif ? (extra.bg || '#eff6ff') : '#fff', color: actif ? (extra.color || '#1e3a5f') : '#64748b',
      transition: 'all .15s',
    })
    const nomComplet = `${form.prenom} ${form.nom}`.trim()
    const boite = BOITES.find(b => b.v === form.boiteVitesse)

    return (
      <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.6)', backdropFilter: 'blur(6px)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0" style={{ borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.3)' }}>
            {/* En-tête : aperçu de l'inscription en cours */}
            <div className="px-6 pt-5 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0f2240 0%,#1e3a5f 55%,#2a4f7c 100%)' }}>
              <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'linear-gradient(90deg,#d4a017,#f0bb2a,#d4a017)' }} />
              <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setShowModal(false)} />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                  {nomComplet ? initials(form.nom, form.prenom) : <i className="bi bi-speedometer2" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f0bb2a' }}>
                    {editId ? 'Modifier · perfectionnement' : 'Nouveau perfectionnement'}
                  </div>
                  <div className="text-xl font-extrabold text-white leading-tight truncate">{nomComplet || 'Nouvel élève'}</div>
                  <div className="text-xs mt-1 flex flex-wrap gap-x-3" style={{ color: '#bfdbfe' }}>
                    <span><i className="bi bi-car-front-fill me-1" />Conduite seule</span>
                    {boite && <span><i className={`bi bi-${boite.icon} me-1`} />{boite.txt}</span>}
                    {total > 0 && <span><i className="bi bi-cash-stack me-1" />{fmtMontant(total)}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-body px-4 sm:px-6 py-5 space-y-4" style={{ background: '#f4f6fa' }}>
              {section(1, 'person-vcard', 'Élève', <>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className={labelCls}>Prénom <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.prenom} onChange={e => set('prenom', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                    <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Téléphone {!editId && <span className="text-red-500">*</span>}</label>
                    <ChampTelephone className={inputCls} value={form.telephone} onChange={v => set('telephone', v)} />
                  </div>
                  <div className="col-md-6">
                    <label className={labelCls}>Date d'inscription <span className="text-red-500">*</span></label>
                    <input type="date" className={inputCls} max={today()} value={form.dateInscription} onChange={e => set('dateInscription', e.target.value)} />
                  </div>
                </div>
              </>)}

              {section(2, 'speedometer2', 'Perfectionnement', <>
                <label className={labelCls}>Boîte de vitesses <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {BOITES.map(b => (
                    <button key={b.v} type="button"
                      onClick={() => setForm(fm => fm.boiteVitesse === b.v ? fm : { ...fm, boiteVitesse: b.v,
                        // Les formules dépendent de la boîte : à l'inscription on repart d'une saisie vide ;
                        // en modification, les montants convenus restent
                        ...(fm.formule ? (editId ? { formule: '' } : { formule: '', montantTotal: '', montantAvance: '' }) : {}) })}
                      className="flex flex-col items-center py-3 cursor-pointer" style={pill(form.boiteVitesse === b.v, { color: '#1e3a5f', bg: '#fef9c3' })}>
                      <i className={`bi bi-${b.icon}`} style={{ fontSize: '1.4rem', color: form.boiteVitesse === b.v ? '#d4a017' : undefined }} />
                      <span className="text-sm font-extrabold leading-none mt-1.5">{b.txt}</span>
                      <span className="text-[10px] font-semibold mt-1 hidden sm:block">{b.sous}</span>
                    </button>
                  ))}
                </div>
                <label className={labelCls}>Lieu d'inscription <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {LIEUX_INSCRIPTION.map(l => (
                    <button key={l.value} type="button"
                      onClick={() => setForm(fm => ({ ...fm, lieuInscription: l.value,
                        // Pas de choix du bureau : à l'inscription il suit le lieu (en ligne → Massalikoul
                        // Djinane) ; en modification, le bureau de suivi ne change pas.
                        site: editId && fm.site ? fm.site : l.value === 'EN_LIGNE' ? 'MAZALIK_JINAN' : l.value }))}
                      className="px-3 py-2 text-sm font-semibold cursor-pointer" style={pill(form.lieuInscription === l.value)}>
                      <i className={`bi bi-${l.value === 'EN_LIGNE' ? 'globe2' : 'building'} me-1`} />{l.label}
                    </button>
                  ))}
                </div>
                {editId && (
                  <div className="mt-4">
                    <label className={labelCls}>Statut</label>
                    <select className={inputCls} value={form.statut} onChange={e => set('statut', e.target.value)}>
                      {STATUTS.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                    </select>
                  </div>
                )}
              </>)}

              {section(3, 'wallet2', 'Paiement', <>
                <div className="mb-3">
                  <label className={labelCls}>Formule</label>
                  {form.boiteVitesse
                    ? <ChoixFormule options={optionsPerfectionnement(tarifs.formulesPerfectionnement, form.boiteVitesse)} valeur={form.formule} onChoisir={choisirFormule}
                    verrouille={!!editId} total={parseFloat(form.montantTotal) || 0} />
                    : <div className="text-xs text-slate-400"><i className="bi bi-info-circle me-1" />Choisissez d'abord la boîte de vitesses pour voir les formules.</div>}
                </div>
                <div className="row g-3">
                  <div className={editId ? 'col-12' : 'col-md-6'}>
                    <label className={labelCls}>Total {!editId && <span className="text-red-500">*</span>}</label>
                    {montant('montantTotal', '100000')}
                  </div>
                  {!editId && <div className="col-md-6">
                    <label className={labelCls}>Acompte <span className="text-red-500">*</span></label>
                    {montant('montantAvance', '50000')}
                  </div>}
                  {!editId && <div className="col-12">
                    <label className={labelCls}>Mode de règlement de l'acompte</label>
                    <div className="grid grid-cols-3 gap-2">
                      {MODES.map(m => (
                        <button key={m.v} type="button" onClick={() => set('moyenAcompte', m.v)}
                          className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold cursor-pointer"
                          style={pill(form.moyenAcompte === m.v, m)}>
                          <i className={`bi bi-${m.icon}`} /><span className="truncate">{m.txt}</span>
                        </button>
                      ))}
                    </div>
                  </div>}
                </div>
                {/* Total, acompte et reliquat calculés en direct */}
                <div className="mt-4 rounded-xl p-3" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                  <div className="grid grid-cols-3 text-center">
                    {[['Total', total, '#fff'], [editId ? 'Déjà payé' : 'Acompte', paye, '#86efac'], ['Reliquat', Math.max(0, total - paye), '#fcd34d']].map(([l, v, c]) => (
                      <div key={l}>
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#93c5fd' }}>{l}</div>
                        <div className="text-sm sm:text-base font-extrabold" style={{ color: c }}>{fmtMontant(v)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.15)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#86efac,#22c55e)', transition: 'width .3s' }} />
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: '#bfdbfe' }}>
                    {editId ? `${pct} % payé · les versements se gèrent dans l'onglet Paiements de la fiche`
                      : acompte > total && total > 0 ? "⚠️ L'acompte dépasse le total" : `${pct} % payé · l'acompte devient la 1re tranche`}
                  </div>
                </div>
              </>)}
            </div>

            <div className="modal-footer border-0 px-6 py-3 flex items-center justify-between gap-2" style={{ background: '#fff', borderTop: '1px solid #eef2f7' }}>
              <div className="text-xs text-slate-500 hidden sm:block">
                {total > 0 ? <>Reliquat à percevoir : <strong className="text-slate-700">{fmtMontant(Math.max(0, total - paye))}</strong></> : 'Les champs * sont obligatoires'}
              </div>
              <div className="flex gap-2 ms-auto">
                <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.85rem' }} onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn fw-bold px-4" onClick={save}
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.85rem', border: 'none', boxShadow: '0 4px 14px rgba(212,160,23,.35)' }}>
                  <i className="bi bi-check2-circle me-1" />{editId ? 'Enregistrer' : 'Inscrire'}
                </button>
              </div>
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
    const suivi = compterSeances(profileData.seances)

    return (
      <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Bannière */}
        <div className="rounded-2xl px-6 py-3 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)' }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #d4a017 0%, transparent 70%)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar p={s} className="w-12 h-12 rounded-full text-base font-extrabold"
                style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', border: '2px solid rgba(255,255,255,.85)' }} />
              <div>
                <div className="font-extrabold text-xl leading-tight">{s.prenom} {s.nom}</div>
                {s.telephone && <div className="text-blue-200 text-xs">{afficherTelephone(s.telephone)}</div>}
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
                  {isAdmin && <button onClick={() => del(s.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5' }}>
                    <i className="bi bi-trash-fill" />Supprimer définitivement
                  </button>}
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
                  {abandonPerf(s) ? (
                    <button onClick={() => supprimerAbandon(s)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                      style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5' }}>
                      <i className="bi bi-trash-fill" />Supprimer
                    </button>
                  ) : (
                    <button onClick={() => archiver(s)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border-0 cursor-pointer"
                      style={{ background: 'rgba(255,255,255,.15)', color: '#fde68a' }}>
                      <i className="bi bi-archive-fill" />Archiver
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
              {/* Photo de profil : la moitié haute de la carte (initiales sans photo) */}
              {s.photoUrl ? (
                <GrandePhoto src={s.photoUrl} alt={`${s.prenom} ${s.nom}`} />
              ) : (
                <div className="w-full flex flex-col items-center justify-center gap-2"
                  style={{ height: 260, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold"
                    style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
                    {initials(s.nom, s.prenom)}
                  </div>
                  <span className="text-xs" style={{ color: '#bfdbfe' }}>Pas de photo · « Modifier » pour en ajouter une</span>
                </div>
              )}
              <div className="divide-y divide-slate-50">
                {[
                  { label: 'Téléphone', value: afficherTelephone(s.telephone) },
                  { label: 'CNI',       value: s.numeroCni },
                  { label: 'Adresse',   value: s.adresse },
                  { label: 'Naissance', value: s.dateNaissance ? `${fmtDate(s.dateNaissance)} (${age(s.dateNaissance)} ans)` : null },
                  { label: 'Inscription', value: fmtDate(s.dateInscription) },
                  s.typeFormation === 'PERFECTIONNEMENT'
                    ? { label: 'Formation', value: `Perfectionnement · boîte ${s.boiteVitesse === 'AUTOMATIQUE' ? 'automatique' : 'manuelle'}` }
                    : { label: 'Catégorie', value: s.categoriePermis },
                  { label: 'Formule', value: s.formule },
                  { label: 'Moniteur',  value: s.moniteur ? `${s.moniteur.prenom} ${s.moniteur.nom}` : 'Aucun' },
                  { label: "Lieu d'inscription", value: s.lieuInscription ? LABELS[s.lieuInscription] : null },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-slate-700 font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ) : null)}
              </div>
              {!isMoniteur && !s.archive && <BienvenueWhatsApp eleve={s} ecole={ecole} />}
            </div>

          </div>

          {/* Colonne droite — onglets */}
          {/* Colonne de droite : onglets Leçons / Examens / Paiements, puis le suivi de formation.
              Elle s'étire à la hauteur de la carte Informations (les onglets prennent la place
              restante) : les deux colonnes finissent sur la même ligne. */}
          <div className="lg:col-span-2 flex flex-col" style={{ gap: '1.25rem' }}>
            <div className="bg-white rounded-2xl overflow-hidden flex-1" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)', minHeight: '260px' }}>
              {/* Onglets */}
              <div className="flex border-b border-slate-100 px-2 pt-2">
                {[
                  { key: 'lecons',    icon: 'journal-text',          label: 'Leçons',    count: profileData.lecons.length + profileData.seances.length },
                  // Perfectionnement : pas d'examen du permis
                  ...(s.typeFormation !== 'PERFECTIONNEMENT' ? [{ key: 'examens', icon: 'clipboard2-check-fill', label: 'Examens', count: profileData.examens.length }] : []),
                  ...(!isMoniteur ? [{ key: 'paiements', icon: 'cash-stack', label: 'Paiements', count: profileData.paiements.length }] : []),
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-0 bg-transparent cursor-pointer transition-all"
                    style={{
                      color: activeTab === tab.key ? '#1e3a5f' : '#94a3b8',
                      borderBottom: activeTab === tab.key ? '2px solid #1e3a5f' : '2px solid transparent',
                    }}>
                    {/* Sur téléphone, pas la place pour icône + libellé + compteur × 3 */}
                    <i className={`bi bi-${tab.icon} hidden sm:inline`} />
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
                  {activeTab === 'lecons'    && <TabLecons    lecons={profileData.lecons} seances={profileData.seances} />}
                  {activeTab === 'examens'   && <TabExamens   examens={profileData.examens} />}
                  {activeTab === 'paiements' && !isMoniteur && <TabPaiements paiements={profileData.paiements} totalPaye={profileData.totalPaye} montantTotal={s.montantTotal} eleveId={s.id} isAdmin={isAdmin} onRefresh={() => openProfile(s, 'paiements')} />}
                </>
              )}
            </div>

            {/* Suivi formation */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                  <i className="bi bi-bar-chart-fill" style={{ color: '#16a34a', fontSize: '.8rem' }} />
                </div>
                <span className="font-bold text-slate-700 text-sm">Suivi de formation</span>
              </div>
              <div className={`grid ${s.typeFormation === 'PERFECTIONNEMENT' ? 'grid-cols-1' : 'grid-cols-3'} divide-x divide-slate-100 text-center py-4`}>
                {/* Leçons faites + séances de cours publiées : le compteur suit les publications */}
                {(s.typeFormation === 'PERFECTIONNEMENT' ? [
                  { val: s.nombreLeconsConduite + suivi.conduite,   label: 'Leçons de conduite', color: '#10b981' },
                ] : [
                  { val: s.nombreLeconsCode + suivi.code,      label: 'Code',     color: '#1e3a5f' },
                  { val: s.nombreLeconsConduite + suivi.conduite,   label: 'Conduite', color: '#10b981' },
                  { val: s.nombreLeconsCode + s.nombreLeconsConduite + suivi.code + suivi.conduite, label: 'Total', color: '#6366f1' },
                ]).map(({ val, label, color }) => (
                  <div key={label}>
                    <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {!loadingProfile && suivi.avecQuiz > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Quiz des séances</span>
                  <span className="text-sm font-bold" style={{ color: '#1e3a5f' }}>{suivi.quizValides} assimilé{suivi.quizValides > 1 ? 's' : ''} · {suivi.quizPasses}/{suivi.avecQuiz} passé{suivi.quizPasses > 1 ? 's' : ''}</span>
                </div>
              )}
              {!loadingProfile && !isMoniteur && (
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Encaissé</span>
                  <span className="text-sm font-bold text-emerald-600">{fmtMontant(profileData.totalPaye)}</span>
                </div>
              )}
              {!loadingProfile && !isMoniteur && s.montantTotal != null && (
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Reliquat</span>
                  <span className="text-sm font-bold" style={{ color: s.montantTotal - profileData.totalPaye > 0 ? '#b45309' : '#047857' }}>
                    {fmtMontant(Math.max(0, s.montantTotal - profileData.totalPaye))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ligne du bas (admin) : dossier Service des Mines et compte de l'élève */}
        {!isMoniteur && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Documents remis (permis seulement) */}
          {s.typeFormation !== 'PERFECTIONNEMENT' && <DocumentsRemis eleve={s} onMaj={maj => {
            setSelected(maj); setList(l => l.map(x => x.id === maj.id ? maj : x)); setFiltered(l => l.map(x => x.id === maj.id ? maj : x))
          }} />}

          {/* Dossier de l'élève : le fichier déposé au Service des Mines (permis seulement) */}
          {s.typeFormation !== 'PERFECTIONNEMENT' && <DossierEleve key={`${s.id}-${showModal}`} eleveId={s.id} />}

          {/* Compte élève */}
          <CompteEleveCard eleve={s} />
        </div>}

        {showModal && fenetreEleve()}
      </div>
    )
  }

  /* ══ VUE LISTE ═══════════════════════════════════════════ */
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

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

      {/* Filtres */}
      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder="Nom, prénom, téléphone…" />
        <Filtre icone="flag" value={statut} onChange={setStatut}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Filtre>
        <Filtre icone="building" value={site} onChange={setSite}>
          <option value="">Tous les bureaux</option>
          {BUREAUX.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Filtre>
        <Filtre icone="mortarboard" value={formation} onChange={setFormation}>
          <option value="">Toutes les formations</option>
          <option value="PERMIS">Permis</option>
          <option value="PERFECTIONNEMENT">Perfectionnement</option>
        </Filtre>
        {/* Admin : n'importe quel mois d'inscription ; moniteur : bascule sur le mois en cours */}
        {isMoniteur
          ? <FiltreBascule actif={moisInscription === MOIS_COURANT()} onClick={() => setMoisInscription(m => m ? '' : MOIS_COURANT())} icone="calendar-check">Nouveaux ce mois</FiltreBascule>
          : <Filtre icone="calendar-month" value={moisInscription} onChange={setMoisInscription}>
              <option value="">Tous les mois</option>
              {moisDisponibles.map(([m, n]) => (
                <option key={m} value={m}>{libelleMois(m)} · {n}</option>
              ))}
            </Filtre>}
        {/* Admin : import Excel et inscription (le moniteur ne fait que consulter ses élèves) */}
        {!isMoniteur && (
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
            <BoutonAjout vert icone="file-earmark-spreadsheet-fill" onClick={() => setShowImport(true)}>Importer</BoutonAjout>
            <BoutonAjout onClick={() => openModal()}>Élève</BoutonAjout>
            {/* Perfectionnement : conduite seule, inscription simplifiée */}
            <div className="col-span-2 sm:col-span-1 grid">
              <BoutonAjout or icone="speedometer2" onClick={() => openModal(null, 'PERFECTIONNEMENT')}>Perfectionnement</BoutonAjout>
            </div>
          </div>
        )}
      </BarreFiltres>

      {/* Liste des élèves */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone={archives ? 'archive-fill' : 'people-fill'}
          titre={isMoniteur ? 'Mes élèves' : archives ? 'Élèves archivés' : 'Liste des élèves'}
          sousTitre={`${filtered.length} élève${filtered.length > 1 ? 's' : ''} · suivi de formation`}
          nombre={filtered.length} />
        {loading ? <ListeChargement />
          : filtered.length === 0 ? <ListeVide texte={archives ? 'Aucun élève archivé' : 'Aucun élève enregistré'} />
          : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(e => {
            const st = STATUT_STYLE[e.statut] || { bg: '#f1f5f9', color: '#64748b', label: e.statut }
            return (
              <LigneListe key={e.id} attenue={e.archive}>
                {/* Identité */}
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarRond photoUrl={e.photoUrl} prenom={e.prenom} nom={e.nom} />
                  <div className="min-w-0">
                    <button onClick={() => ouvrirFiche(e)}
                      className="block text-left font-bold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-full">
                      {e.prenom} {e.nom}
                    </button>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                      <span><i className="bi bi-telephone me-1" />{e.telephone ? afficherTelephone(e.telephone) : 'Pas de numéro'}</span>
                      {e.site && <span><i className="bi bi-building me-1" />{LABELS[e.site] || e.site}</span>}
                    </div>
                  </div>
                </div>

                {/* Formation */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Perfectionnement : compteur doré (boîte en info-bulle) ; permis : la lettre de la catégorie */}
                  {e.typeFormation === 'PERFECTIONNEMENT' ? (
                    <div title={`Perfectionnement · boîte ${e.boiteVitesse === 'AUTOMATIQUE' ? 'automatique' : 'manuelle'}`}
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ borderRadius: '.8rem', background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f',
                        borderBottom: '3px solid #1e3a5f', boxShadow: '0 2px 6px rgba(212,160,23,.3)' }}>
                      <i className="bi bi-speedometer2" />
                    </div>
                  ) : <div title={`Permis ${e.categoriePermis}`}
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg font-extrabold"
                    style={{ borderRadius: '.8rem', background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#f0bb2a',
                      borderBottom: '3px solid #d4a017', boxShadow: '0 2px 6px rgba(15,34,64,.18)' }}>
                    {e.categoriePermis}
                  </div>}
                  <div className="min-w-0 text-xs">
                    <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Moniteur</div>
                    <div className="font-semibold text-slate-700 truncate">
                      {e.moniteur ? `${e.moniteur.prenom} ${e.moniteur.nom}` : <span className="text-slate-400">Aucun</span>}
                    </div>
                  </div>
                </div>

                {/* Suivi */}
                <div className="text-xs min-w-0">
                  <div className="flex items-center gap-3 text-slate-600">
                    {e.typeFormation === 'PERFECTIONNEMENT'
                      ? <span className="font-semibold" style={{ color: '#a16207' }}>{e.boiteVitesse === 'AUTOMATIQUE' ? 'Automatique' : 'Manuelle'}</span>
                      : <span title="Leçons de code"><i className="bi bi-signpost-2 me-1" style={{ color: '#2563eb' }} /><b>{e.nombreLeconsCode}</b> code</span>}
                    <span title="Leçons de conduite"><i className="bi bi-car-front me-1" style={{ color: '#15803d' }} /><b>{e.nombreLeconsConduite}</b> conduite</span>
                  </div>
                  <div className="text-slate-400 mt-1">
                    {archives && e.dateArchivage ? <>Archivé le {fmtDate(e.dateArchivage)}</> : <>Inscrit le {fmtDate(e.dateInscription)}</>}
                  </div>
                </div>

                {/* Statut et actions */}
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <Pastille couleur={st.color} fond={st.bg}>{st.label}</Pastille>
                  <div className="flex items-center gap-1.5">
                    <BoutonRond title="Voir la fiche" icon="eye-fill" couleur="#1e3a5f" fond="#eff6ff" onClick={() => ouvrirFiche(e)} />
                    {!isMoniteur && !e.archive && <>
                      <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => openModal(e)} />
                      {abandonPerf(e)
                        ? <BoutonRond title="Supprimer (perfectionnement abandonné)" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimerAbandon(e)} />
                        : <BoutonRond title="Archiver" icon="archive-fill" couleur="#a16207" fond="#fef9c3" onClick={() => archiver(e)} />}
                    </>}
                    {!isMoniteur && e.archive && <>
                      <BoutonRond title="Réactiver" icon="arrow-counterclockwise" couleur="#15803d" fond="#dcfce7" onClick={() => reactiver(e)} />
                      {isAdmin && <BoutonRond title="Supprimer définitivement" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => del(e.id)} />}
                    </>}
                  </div>
                </div>
              </LigneListe>
            )
          })}
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {showImport && <ImportEleves onClose={() => setShowImport(false)} onDone={load} />}
      {showModal && fenetreEleve()}
    </div>
  )
}
