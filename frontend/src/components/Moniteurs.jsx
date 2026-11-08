import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, LABELS, waLink, correspond, estAdmin } from '../utils'
import { msgBienvenueMoniteur } from '../messages'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import Pagination from './Pagination'
import PhotoPicker from './PhotoPicker'
import '../landing.css'
import GrandePhoto from './GrandePhoto'
import { FenetreModerne, Etape, Etiquette, Choix } from './FenetreModerne'
import { EnteteListe, LigneListe, AvatarRond, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche, BoutonAjout } from './ListeModerne'
import { champCls, stylePastille } from './fenetreStyles'
import ChampTelephone from './ChampTelephone'
import { afficherTelephone } from '../telephones'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../presence'
import { BadgePresence } from './Presence'

const PAGE_SIZE = 10

const CATS = [
  { value: 'A', label: 'A', bg: '#fef9c3', color: '#854d0e' },
  { value: 'B', label: 'B', bg: '#dbeafe', color: '#1d4ed8' },
  { value: 'C', label: 'C', bg: '#fce7f3', color: '#be185d' },
  { value: 'D', label: 'D', bg: '#d1fae5', color: '#065f46' },
]
const CAT_MAP = Object.fromEntries(CATS.map(c => [c.value, c]))
const EMPTY = { nom: '', prenom: '', telephone: '', numeroCni: '', numeroPermis: '', dateEmbauche: '', photoUrl: '', categoriesAutorisees: [], actif: true, accesCoursCode: false }

/* ── Statut élève styles ──────────────────────────────────── */
const STATUT_ELEVE = {
  EN_COURS:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb', label: 'En cours' },
  DIPLOME:   { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Diplômé' },
  SUSPENDU:  { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Suspendu' },
  ABANDONNE: { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Abandonné' },
}

/* ── En-tête de section réutilisable ────────────────────────── */
function SectionHeader({ gradient, border, icon, iconBg, iconColor, title, subtitle, badge, badgeStyle }) {
  return (
    <div className="flex items-center justify-between px-6 py-3"
      style={{ background: gradient, borderBottom: `2px solid ${border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: iconBg }}>
          <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.85rem' }} />
        </div>
        <div>
          <div className="font-extrabold text-sm leading-tight" style={{ color: title.color }}>{title.text}</div>
          <div className="text-xs mt-0.5" style={{ color: subtitle.color }}>{subtitle.text}</div>
        </div>
      </div>
      {badge != null && (
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={badgeStyle}>{badge}</span>
      )}
    </div>
  )
}

/* ── Badge statut avec point coloré ──────────────────────── */
function StatutBadge({ statut }) {
  if (statut === true || statut === false) {
    const s = statut
      ? { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Actif' }
      : { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: 'Inactif' }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: s.bg, color: s.color }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
        {s.label}
      </span>
    )
  }
  const s = STATUT_ELEVE[statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: statut }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

/* ── Message de bienvenue : crée le compte du moniteur (identifiant = téléphone) ──
   et ouvre WhatsApp avec ses identifiants. Comme pour l'élève, le lien WhatsApp est
   dans la fenêtre de confirmation : un window.open après un await est bloqué sur mobile. */
function BienvenueMoniteur({ moniteur }) {
  const [loading, setLoading] = useState(false)
  const [creds, setCreds]     = useState(null)
  const [ecole, setEcole]     = useState('')

  if (!waLink(moniteur.telephone)) return null

  const generer = async () => {
    if (!moniteur.actif) { toast('Moniteur inactif : réactivez-le d\'abord', 'warning'); return }
    if (!(await confirmer({ titre: `Nouveau mot de passe pour ${moniteur.prenom} ?`, ton: 'alerte', icone: 'key-fill', libelle: 'Générer',
      message: "S'il avait déjà un compte, son ancien mot de passe ne fonctionnera plus. Vous pourrez ensuite lui envoyer ses identifiants par WhatsApp." }))) return
    setLoading(true)
    try {
      const [c, cfg] = await Promise.all([
        api('POST', `/moniteurs/${moniteur.id}/identifiants`),
        api('GET', '/config').catch(() => ({})),
      ])
      setEcole(cfg?.nom || ''); setCreds(c)
    } catch (e) { toast(e.message, 'danger') }
    finally { setLoading(false) }
  }

  const message = creds && msgBienvenueMoniteur(moniteur, ecole, creds)

  return (
    <div className="px-5 py-3 border-t border-slate-100">
      <button onClick={generer} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold border-0 cursor-pointer"
        style={{ background: '#25d366', color: '#fff', borderRadius: '.75rem', opacity: loading ? .7 : 1 }}>
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
                <a href={waLink(moniteur.telephone, message)} target="_blank" rel="noopener noreferrer"
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

/* ── Avatar : photo du moniteur, sinon ses initiales ─────── */
function Avatar({ m, size = 36, radius = '.75rem', style }) {
  const base = { width: size, height: size, borderRadius: radius, flexShrink: 0, ...style }
  if (m.photoUrl) return <img src={m.photoUrl} alt="" style={{ ...base, objectFit: 'cover', objectPosition: 'center 25%' }} />
  return (
    <div className="flex items-center justify-center font-extrabold"
      style={{ ...base, fontSize: size * 0.36, background: 'linear-gradient(135deg, #d4a017, #f0bb2a)', color: '#1e3a5f' }}>
      {m.nom?.[0]}{m.prenom?.[0]}
    </div>
  )
}

/* ── Input / Label styles partagés ──────────────────────── */
const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 text-sm outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5"

export default function Moniteurs({ onProfilChange, moniteurId, onOuvrir, onFermer }) {
  const { user } = useAuth()
  const admin = estAdmin(user?.role)   // la suppression est réservée aux administrateurs
  const presence = usePresence(admin)   // moniteurs connectés en ce moment (administration)
  const [list, setList]               = useState([])
  const [filtered, setFiltered]       = useState([])
  const [search, setSearch]           = useState('')
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [elevesSelected, setElevesSel] = useState([])
  const [loadingEleves, setLoadingEl] = useState(false)
  const [elevesCount, setElevesCount] = useState({})
  const [page, setPage]               = useState(1)
  const [pageEleves, setPageEleves]   = useState(1)

  useEffect(() => {
    if (!showModal) return
    const handler = (e) => { if (e.key === 'Escape') setShowModal(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showModal])

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('GET', '/moniteurs')
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement moniteurs', 'danger') }
    finally { setLoading(false) }
    try {
      const eleves = await api('GET', '/eleves')
      const counts = {}
      eleves.forEach(e => {
        if (e.moniteur?.id) counts[e.moniteur.id] = (counts[e.moniteur.id] || 0) + 1
      })
      setElevesCount(counts)
    } catch { /* optionnel */ }
  }

  useEffect(() => { load() }, [])

  // Derniers moniteurs ajoutés en haut (ordre de création)
  useEffect(() => {
    const r = search.trim() ? list.filter(m => correspond([m.prenom, m.nom, m.telephone], search)) : list
    setFiltered([...r].sort((a, b) => b.id - a.id))
    if (search.trim()) setPage(1)
  }, [search, list])

  /* ── Ouvrir le profil ──────────────────────────────────── */
  const openProfile = async (m) => {
    setSelected(m)
    onProfilChange?.(true)
    setElevesSel([])
    setPageEleves(1)
    setLoadingEl(true)
    try {
      const eleves = await api('GET', `/moniteurs/${m.id}/eleves`)
      setElevesSel(eleves)
    } catch { toast('Impossible de charger les élèves', 'danger') }
    finally { setLoadingEl(false) }
  }

  const closeProfile = () => { setSelected(null); setElevesSel([]); onProfilChange?.(false) }

  /* Fiche dans l'URL (…/moniteurs/3) : l'ouverture et la fermeture passent par l'adresse,
     pour que Retour revienne à la liste. Sans ces fonctions, simple état local. */
  const ouvrirFiche = (m) => onOuvrir ? onOuvrir(m.id) : openProfile(m)
  const fermerFiche = () => onFermer ? onFermer() : closeProfile()
  useEffect(() => {
    if (!moniteurId) return
    api('GET', `/moniteurs/${moniteurId}`).then(openProfile).catch(() => toast('Moniteur introuvable', 'danger'))
  }, [moniteurId])

  /* ── Modal création / modification ────────────────────── */
  const openModal = (m = null) => {
    if (m) {
      setEditId(m.id)
      setForm({
        nom: m.nom, prenom: m.prenom, telephone: m.telephone,
        numeroCni: m.numeroCni || '', numeroPermis: m.numeroPermis || '',
        dateEmbauche: m.dateEmbauche || '', photoUrl: m.photoUrl || '', categoriesAutorisees: m.categoriesAutorisees || [], actif: m.actif, accesCoursCode: !!m.accesCoursCode
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const toggleCat = (cat) => {
    setForm(f => ({
      ...f,
      categoriesAutorisees: f.categoriesAutorisees.includes(cat)
        ? f.categoriesAutorisees.filter(c => c !== cat)
        : [...f.categoriesAutorisees, cat]
    }))
  }

  const save = async () => {
    if (!form.nom || !form.prenom || !form.telephone) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = {
      ...form,
      numeroCni: form.numeroCni || null,
      numeroPermis: form.numeroPermis || null, dateEmbauche: form.dateEmbauche || null,
      photoUrl: form.photoUrl || null
    }
    try {
      if (editId) { await api('PUT', `/moniteurs/${editId}`, data); toast('Moniteur modifié') }
      else { await api('POST', '/moniteurs', data); toast('Moniteur créé') }
      setShowModal(false)
      await load()
      if (editId && selected?.id === editId) {
        const updated = await api('GET', `/moniteurs/${editId}`)
        setSelected(updated)
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  /* Suppression (administrateurs) : refusée par le serveur si le moniteur a des leçons ou des
     séances ; on propose alors de le désactiver, ce qui garde l'historique des élèves. */
  const supprimer = async (m) => {
    const nb = elevesCount[m.id] ?? 0
    if (!(await confirmer({ titre: `Supprimer ${m.prenom} ${m.nom} ?`, ton: 'danger', icone: 'trash3-fill', libelle: 'Supprimer',
      message: `Sa fiche et son compte de connexion seront supprimés définitivement.${nb === 1 ? ' Son élève restera inscrit, sans moniteur.' : nb > 1 ? ` Ses ${nb} élèves resteront inscrits, sans moniteur.` : ''}` }))) return
    try {
      await api('DELETE', `/moniteurs/${m.id}`); toast('Moniteur supprimé')
      if (selected?.id === m.id) fermerFiche()
      await load()
    } catch (e) {
      if (m.actif && /désactivez-le/.test(e.message)) {
        if (await confirmer({ titre: 'Suppression impossible', ton: 'alerte', icone: 'pause-circle-fill', libelle: 'Désactiver', message: e.message }))
          await toggleActif(m.id)
      } else toast(e.message, 'danger')
    }
  }

  const toggleActif = async (id) => {
    try {
      await api('PATCH', `/moniteurs/${id}/toggle-actif`); toast('Statut mis à jour'); await load()
      if (selected?.id === id) {
        const updated = await api('GET', `/moniteurs/${id}`)
        setSelected(updated)
      }
    } catch (e) { toast(e.message, 'danger') }
  }

  /* ══ FENÊTRE AJOUT / MODIFICATION ════════════════════════════ */
  function renderModal() {
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const nomComplet = `${form.prenom} ${form.nom}`.trim()
    return (
      <FenetreModerne
        surTitre={editId ? 'Modifier le moniteur' : 'Nouveau moniteur'}
        titre={nomComplet || 'Nouveau moniteur'}
        avatar={form.photoUrl ? (
          <img src={form.photoUrl} alt="" className="w-16 h-16 rounded-full flex-shrink-0"
            style={{ objectFit: 'cover', objectPosition: 'center 25%', border: '3px solid #f0bb2a' }} />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
            style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f' }}>
            {nomComplet ? ((form.prenom[0] || '') + (form.nom[0] || '')).toUpperCase() : <i className="bi bi-person-badge-fill" />}
          </div>
        )}
        details={[
          form.telephone && ['telephone', form.telephone],
          form.categoriesAutorisees.length > 0 && ['award', `Permis ${[...form.categoriesAutorisees].sort().join(', ')}`],
          ['circle-fill', form.actif ? 'Actif' : 'Inactif'],
        ]}
        onClose={() => setShowModal(false)} onSave={save}
        libelleSave={editId ? 'Enregistrer' : 'Ajouter le moniteur'}>
        <Etape n={1} icon="person-vcard" titre="Identité">
          <div className="mb-3"><PhotoPicker value={form.photoUrl} onChange={url => set('photoUrl', url)} /></div>
          <div className="row g-3">
            <div className="col-md-6">
              <Etiquette requis>Prénom</Etiquette>
              <input className={champCls} value={form.prenom} onChange={e => set('prenom', e.target.value)} />
            </div>
            <div className="col-md-6">
              <Etiquette requis>Nom</Etiquette>
              <input className={champCls} value={form.nom} onChange={e => set('nom', e.target.value)} />
            </div>
            <div className="col-md-6">
              <Etiquette requis>Téléphone</Etiquette>
              <ChampTelephone className={champCls} value={form.telephone} onChange={v => set('telephone', v)} />
              <div className="text-[11px] text-slate-400 mt-1">Sert d'identifiant de connexion au moniteur</div>
            </div>
            <div className="col-md-6">
              <Etiquette>Numéro CNI</Etiquette>
              <input className={champCls} value={form.numeroCni} placeholder="N° CNI" onChange={e => set('numeroCni', e.target.value)} />
            </div>
          </div>
        </Etape>

        <Etape n={2} icon="briefcase" titre="Activité">
          <div className="row g-3">
            <div className="col-md-6">
              <Etiquette>N° de permis</Etiquette>
              <input className={champCls} value={form.numeroPermis} placeholder="SN-B-001" onChange={e => set('numeroPermis', e.target.value)} />
            </div>
            <div className="col-md-6">
              <Etiquette>Date d'embauche</Etiquette>
              <input type="date" className={champCls} value={form.dateEmbauche} onChange={e => set('dateEmbauche', e.target.value)} />
            </div>
            <div className="col-12">
              <Etiquette>Statut</Etiquette>
              <Choix cols={2} value={form.actif ? 'actif' : 'inactif'} onChange={v => set('actif', v === 'actif')} options={[
                { v: 'actif',   label: 'Actif',   icon: 'check-circle-fill', color: '#15803d', bg: '#dcfce7' },
                { v: 'inactif', label: 'Inactif', icon: 'pause-circle-fill', color: '#b91c1c', bg: '#fee2e2' },
              ]} />
            </div>
            <div className="col-12">
              {/* Fermé par défaut : seuls les moniteurs choisis voient le menu « Cours Code » */}
              <Etiquette>Accès aux cours de code</Etiquette>
              <Choix cols={2} value={form.accesCoursCode ? 'oui' : 'non'} onChange={v => set('accesCoursCode', v === 'oui')} options={[
                { v: 'non', label: 'Masqués', icon: 'eye-slash-fill', color: '#64748b', bg: '#f1f5f9' },
                { v: 'oui', label: 'Visibles', icon: 'eye-fill',      color: '#1d4ed8', bg: '#dbeafe' },
              ]} />
            </div>
          </div>
        </Etape>

        <Etape n={3} icon="award" titre="Catégories enseignées">
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: 'A', icon: 'scooter',          sous: 'Moto' },
              { v: 'B', icon: 'car-front-fill',   sous: 'Voiture' },
              { v: 'C', icon: 'truck-front-fill', sous: 'Poids lourd' },
              { v: 'D', icon: 'bus-front-fill',   sous: 'Transport' },
            ].map(c => {
              const sel = form.categoriesAutorisees.includes(c.v)
              return (
                <button key={c.v} type="button" onClick={() => toggleCat(c.v)}
                  className="flex flex-col items-center py-3 cursor-pointer relative" style={stylePastille(sel)}>
                  {sel && <i className="bi bi-check-circle-fill absolute top-1.5 right-2" style={{ fontSize: '.8rem' }} />}
                  <i className={`bi bi-${c.icon}`} style={{ fontSize: '1.4rem' }} />
                  <span className="text-sm font-extrabold mt-1">{c.v}</span>
                  <span className="text-[10px] font-semibold mt-0.5">{c.sous}</span>
                </button>
              )
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Plusieurs choix possibles · {form.categoriesAutorisees.length}/4 sélectionnée{form.categoriesAutorisees.length > 1 ? 's' : ''}</div>
        </Etape>
      </FenetreModerne>
    )
  }

  /* ══ VUE PROFIL ══════════════════════════════════════════════ */
  if (selected) return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Bannière profil navy */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #142a47 0%, #1e3a5f 50%, #2a4f7c 100%)', boxShadow: '0 8px 32px rgba(30,58,95,.3)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, #d4a017, transparent)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />

        <div className="relative px-6 py-2 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar + nom */}
          <div className="flex items-center gap-4">
            <Avatar m={selected} size={48} radius="50%" style={{ border: '2px solid rgba(255,255,255,.85)' }} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#93c5fd' }}>Fiche moniteur</div>
              <div className="text-xl font-extrabold text-white leading-tight">{selected.prenom} {selected.nom}</div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                {selected.telephone && <span className="text-sm" style={{ color: '#bfdbfe' }}>{selected.telephone}</span>}
                {/* Administration : le moniteur a-t-il le site ouvert en ce moment ? */}
                {presence && <BadgePresence enLigne={presence.moniteurs.has(selected.id)} />}
              </div>
            </div>
          </div>

          {/* Droite : statut + actions */}
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border"
              style={{
                background: selected.actif ? 'rgba(34,197,94,.2)' : 'rgba(148,163,184,.2)',
                color: selected.actif ? '#86efac' : '#cbd5e1',
                borderColor: 'rgba(255,255,255,.1)'
              }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 align-middle"
                style={{ background: selected.actif ? '#86efac' : '#94a3b8' }} />
              {selected.actif ? 'Actif' : 'Inactif'}
            </span>
            <button onClick={() => toggleActif(selected.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all"
              style={{ background: selected.actif ? 'rgba(251,191,36,.18)' : 'rgba(34,197,94,.18)', color: selected.actif ? '#fbbf24' : '#86efac' }}>
              <i className={`bi bi-${selected.actif ? 'pause-circle' : 'play-circle'}-fill`} />
              {selected.actif ? 'Désactiver' : 'Activer'}
            </button>
            <button onClick={() => openModal(selected)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,.14)', color: '#e2e8f0' }}>
              <i className="bi bi-pencil-fill" />
              Modifier
            </button>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button onClick={fermerFiche} className="btn-retour">
        <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
        Retour
      </button>

      {/* Grid 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Colonne gauche : infos perso ──────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <SectionHeader
            gradient="linear-gradient(135deg, #1e3a5f 0%, #2a4f7c 100%)"
            border="#1e3a5f"
            icon="person-badge-fill"
            iconBg="rgba(255,255,255,.18)"
            iconColor="#fff"
            title={{ text: 'Informations personnelles', color: '#fff' }}
            subtitle={{ text: 'Données du moniteur', color: 'rgba(147,197,253,.85)' }}
          />
          {/* Photo de profil : la moitié haute de la carte (initiales sans photo) */}
          {selected.photoUrl ? (
            <GrandePhoto src={selected.photoUrl} alt={`${selected.prenom} ${selected.nom}`} />
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-2"
              style={{ height: 260, background: 'linear-gradient(135deg,#142a47,#2a4f7c)' }}>
              <Avatar m={selected} size={96} radius="50%" />
              <span className="text-xs" style={{ color: '#bfdbfe' }}>Pas de photo · « Modifier » pour en ajouter une</span>
            </div>
          )}
          <div className="px-5 py-2">
            {[
              { icon: 'telephone',    label: 'Téléphone',       value: selected.telephone,                           iconBg: '#fef9c3', iconColor: '#b45309' },
              { icon: 'credit-card',  label: 'Numéro CNI',      value: selected.numeroCni,                           iconBg: '#f0fdf4', iconColor: '#15803d' },
              { icon: 'card-checklist', label: 'N° Permis',     value: selected.numeroPermis,                        iconBg: '#eef2ff', iconColor: '#4f46e5' },
              { icon: 'calendar-event', label: "Date d'embauche", value: selected.dateEmbauche ? fmtDate(selected.dateEmbauche) : null, iconBg: '#fdf4ff', iconColor: '#9333ea' },
              { icon: 'sign-turn-right', label: 'Cours de code', value: selected.accesCoursCode ? 'Visibles' : 'Masqués',  iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            ].filter(r => r.value).map(({ icon, label, value, iconBg, iconColor }, i, arr) => (
              <div key={label} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg }}>
                  <i className={`bi bi-${icon}`} style={{ color: iconColor, fontSize: '.78rem' }} />
                </div>
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-700 font-medium text-right truncate">{value}</span>
                </div>
              </div>
            ))}

            {/* Catégories */}
            {selected.categoriesAutorisees?.length > 0 && (
              <div className="pt-3 pb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catégories autorisées</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.categoriesAutorisees.map(c => {
                    const cat = CAT_MAP[c] || { label: c, bg: '#f1f5f9', color: '#475569' }
                    return (
                      <span key={c} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: cat.bg, color: cat.color }}>
                        {cat.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <BienvenueMoniteur moniteur={selected} />
        </div>

        {/* ── Colonne droite : élèves assignés ──────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <SectionHeader
            gradient="linear-gradient(135deg, #d4a017 0%, #f0bb2a 100%)"
            border="#b8860b"
            icon="people-fill"
            iconBg="rgba(255,255,255,.25)"
            iconColor="#1e3a5f"
            title={{ text: 'Élèves assignés', color: '#1e3a5f' }}
            subtitle={{ text: 'Apprenants encadrés par ce moniteur', color: 'rgba(30,58,95,.6)' }}
            badge={loadingEleves ? '…' : elevesSelected.length}
            badgeStyle={{ background: 'rgba(30,58,95,.15)', color: '#1e3a5f' }}
          />

          {loadingEleves ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1e3a5f] rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Chargement…</span>
              </div>
            </div>
          ) : elevesSelected.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100">
                <i className="bi bi-person-x" style={{ fontSize: '1.4rem', color: '#94a3b8' }} />
              </div>
              <div className="text-sm font-medium text-slate-400">Aucun élève assigné à ce moniteur</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-cards">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nom & Prénom', 'Téléphone', 'Catégorie', 'Statut', 'Inscription'].map((h, i) => (
                      <th key={h} className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elevesSelected.slice((pageEleves-1)*PAGE_SIZE, pageEleves*PAGE_SIZE).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      className="transition-colors hover:bg-blue-50/40">
                      <td className="py-3.5 px-4 text-center cell-hide">
                        <span className="text-xs font-bold text-slate-300">{(pageEleves-1)*PAGE_SIZE + i + 1}</span>
                      </td>
                      <td className="py-3.5 px-4 cell-title">
                        <div className="text-sm font-semibold text-slate-700">{e.prenom} {e.nom}</div>
                      </td>
                      <td className="py-3.5 px-4" data-label="Téléphone">
                        <span className="text-sm text-slate-600">{e.telephone}</span>
                      </td>
                      <td className="py-3.5 px-4" data-label="Catégorie">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a4f7c)' }}>
                          {e.categoriePermis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4" data-label="Statut">
                        <StatutBadge statut={e.statut} />
                      </td>
                      <td className="py-3.5 px-4" data-label="Inscription">
                        <span className="text-xs text-slate-500">{fmtDate(e.dateInscription)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={pageEleves} setPage={setPageEleves} total={elevesSelected.length} pageSize={PAGE_SIZE} />
            </div>
          )}
        </div>
      </div>

      {showModal && renderModal()}
    </div>
  )

  /* ══ VUE LISTE ═══════════════════════════════════════════════ */
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête : barre de recherche avec le bouton d'ajout (même disposition sur toutes les pages) */}
      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder="Rechercher par nom ou prénom…" />
        <BoutonAjout onClick={() => openModal()}>Moniteur</BoutonAjout>
      </BarreFiltres>

      {/* Liste des moniteurs */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="person-badge-fill" titre="Moniteurs" sousTitre="Personnel enseignant" nombre={filtered.length} />
        {loading ? <ListeChargement />
          : filtered.length === 0 ? <ListeVide texte="Aucun moniteur enregistré" />
          : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(m => (
            <LigneListe key={m.id} attenue={!m.actif}>
              {/* Identité */}
              <div className="flex items-center gap-3 min-w-0">
                <AvatarRond photoUrl={m.photoUrl} prenom={m.prenom} nom={m.nom} />
                <div className="min-w-0">
                  <button onClick={() => ouvrirFiche(m)}
                    className="block text-left font-bold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-full">
                    {m.prenom} {m.nom}
                  </button>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                    <span><i className="bi bi-telephone me-1" />{afficherTelephone(m.telephone)}</span>
                    {m.numeroPermis && <span><i className="bi bi-card-checklist me-1" />{m.numeroPermis}</span>}
                    {presence && <BadgePresence enLigne={presence.moniteurs.has(m.id)} />}
                  </div>
                </div>
              </div>

              {/* Catégories enseignées */}
              <div className="min-w-0">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Catégories</div>
                <div className="flex flex-wrap gap-1.5">
                  {(m.categoriesAutorisees || []).length ? [...m.categoriesAutorisees].sort().map(c => {
                    const cat = CAT_MAP[c] || { label: c, bg: '#f1f5f9', color: '#475569' }
                    return (
                      <span key={c} className="w-7 h-7 flex items-center justify-center text-xs font-extrabold"
                        style={{ borderRadius: '.6rem', background: cat.bg, color: cat.color }}>{cat.label}</span>
                    )
                  }) : <span className="text-xs text-slate-400">Aucune</span>}
                </div>
              </div>

              {/* Élèves et embauche */}
              <div className="text-xs min-w-0">
                <button onClick={() => ouvrirFiche(m)}
                  className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 border-0 cursor-pointer"
                  style={{ borderRadius: '999px', background: '#dbeafe', color: '#1d4ed8' }}>
                  <i className="bi bi-people-fill" />{elevesCount[m.id] ?? 0} élève{(elevesCount[m.id] ?? 0) > 1 ? 's' : ''}
                </button>
                <div className="text-slate-400 mt-1">{m.dateEmbauche ? <>Embauché le {fmtDate(m.dateEmbauche)}</> : 'Date d\'embauche non renseignée'}</div>
              </div>

              {/* Statut et actions */}
              <div className="flex items-center justify-between md:justify-end gap-2">
                <Pastille couleur={m.actif ? '#15803d' : '#b91c1c'} fond={m.actif ? '#dcfce7' : '#fee2e2'}>{m.actif ? 'Actif' : 'Inactif'}</Pastille>
                <div className="flex items-center gap-1.5">
                  <BoutonRond title="Voir la fiche" icon="eye-fill" couleur="#1e3a5f" fond="#eff6ff" onClick={() => ouvrirFiche(m)} />
                  <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => openModal(m)} />
                  <BoutonRond title={m.actif ? 'Désactiver' : 'Activer'} icon={m.actif ? 'pause-circle-fill' : 'play-circle-fill'}
                    couleur={m.actif ? '#a16207' : '#15803d'} fond={m.actif ? '#fef9c3' : '#dcfce7'} onClick={() => toggleActif(m.id)} />
                  {admin && <BoutonRond title="Supprimer" icon="trash3-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimer(m)} />}
                </div>
              </div>
            </LigneListe>
          ))}
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {showModal && renderModal()}
    </div>
  )
}
