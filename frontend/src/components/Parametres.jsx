import { useState, useEffect, useRef } from 'react'
import { api, uploadFile } from '../api'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import ComptesSecretariat from './ComptesSecretariat'
import { useAuth } from '../context/AuthContext'
import { rechargerEcole } from '../ecole'
import { useBureaux, rechargerBureaux } from '../bureaux'

const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const inputCls = 'form-control'

/* Formules d'obtention du permis : montant total et échéancier (Standard en deux versements). */
const FORMULES = [
  { nom: 'Standard',   icone: 'car-front',     couleur: '#475569', fond: '#f1f5f9', tranches: 2 },
  { nom: 'Premium',    icone: 'star-fill',     couleur: '#1d4ed8', fond: '#dbeafe', tranches: 3 },
  { nom: 'Prestige',   icone: 'gem',           couleur: '#7c3aed', fond: '#ede9fe', tranches: 3 },
  { nom: 'Excellence', icone: 'trophy-fill',   couleur: '#b45309', fond: '#fef3c7', tranches: 3 },
]
/* Permis A, et permis C et D : chacun une seule formule Standard, à son propre prix. */
const FORMULE_MOTO = { nom: 'Standard', titre: 'Standard · permis A', icone: 'scooter', couleur: '#be123c', fond: '#ffe4e6', tranches: 2 }
const FORMULE_POIDS_LOURD = { nom: 'Standard', titre: 'Standard · permis C et D', icone: 'truck-front-fill', couleur: '#0f766e', fond: '#ccfbf1', tranches: 2 }
const CHAMPS_FORMULE = [['montant', 'Montant de la formule'], ['acompte', 'Acompte'], ['tranche2', '2e tranche'], ['tranche3', '3e tranche']]
const fcfa = n => `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f/g, ' ')} F`

function formulesDepuis(liste, defs = FORMULES) {
  return defs.map(({ nom }) => {
    const f = (liste || []).find(x => x.nom === nom) || {}
    return { nom, montant: f.montant ?? '', acompte: f.acompte ?? '', tranche2: f.tranche2 ?? '', tranche3: f.tranche3 ?? '', contenu: (f.contenu || []).join('\n') }
  })
}

/* Formules de perfectionnement : boîte et nombre de cours fixés, montants modifiables. */
const BOITES_PERF = [
  { v: 'AUTOMATIQUE', label: 'Boîte automatique', icone: 'lightning-charge-fill', couleur: '#0369a1', fond: '#e0f2fe' },
  { v: 'MANUELLE',    label: 'Boîte manuelle',    icone: 'gear-wide-connected',   couleur: '#a16207', fond: '#fef9c3' },
]

/* Boutons d'une formule : « Modifier » en lecture, « Annuler / Enregistrer » en modification. */
function BoutonsFormule({ edition, envoi, valide, onModifier, onAnnuler, onEnregistrer, nom }) {
  const base = { borderRadius: '.6rem', fontSize: '.78rem', fontWeight: 700, padding: '.3rem .7rem', whiteSpace: 'nowrap' }
  if (!edition) return (
    <button type="button" onClick={onModifier} aria-label={`Modifier ${nom}`}
      style={{ ...base, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}>
      <i className="bi bi-pencil me-1" />Modifier
    </button>
  )
  return (
    <div className="d-flex gap-1">
      <button type="button" onClick={onAnnuler} disabled={envoi}
        style={{ ...base, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b' }}>Annuler</button>
      <button type="button" onClick={onEnregistrer} disabled={envoi || !valide} aria-label={`Enregistrer ${nom}`}
        style={{ ...base, border: 'none', background: valide ? '#16a34a' : '#cbd5e1', color: '#fff' }}>
        {envoi ? <span className="spinner-border spinner-border-sm" style={{ width: '.8rem', height: '.8rem' }} /> : <><i className="bi bi-check2 me-1" />Enregistrer</>}
      </button>
    </div>
  )
}

/* Modification d'une formule : brouillon local, enregistré d'un coup (le reste de la page ne bouge pas). */
function useEdition(valeur, onEnregistrer) {
  const [brouillon, setBrouillon] = useState(null)   // null : lecture seule
  const [envoi, setEnvoi] = useState(false)
  const enregistrer = async () => {
    setEnvoi(true)
    try { await onEnregistrer(brouillon); setBrouillon(null) }
    catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(false) }
  }
  return { edition: brouillon !== null, v: brouillon ?? valeur, setV: setBrouillon, envoi,
    modifier: () => setBrouillon({ ...valeur }), annuler: () => setBrouillon(null), enregistrer }
}

/* Pastilles de l'échéancier (lecture seule). */
function Echeancier({ montants }) {
  const reste = montants.slice(1).filter(x => x > 0)
  return (
    <div className="d-flex flex-wrap gap-1 mt-2">
      <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700 }}>Acompte {fcfa(montants[0])}</span>
      {reste.map((m, k) => (
        <span key={k} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 999, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700 }}>{k + 2}e tranche {fcfa(m)}</span>
      ))}
      {reste.length === 0 && <span style={{ color: '#94a3b8', fontSize: '.72rem', fontWeight: 600, alignSelf: 'center' }}>en une fois</span>}
    </div>
  )
}

/* Ce que comprend une formule (lecture seule), une ligne cochée par élément. */
function ContenuFormule({ lignes }) {
  const l = (lignes || '').split('\n').map(x => x.trim()).filter(Boolean)
  if (!l.length) return null
  return (
    <ul className="list-unstyled mt-2 mb-0" style={{ fontSize: '.8rem', color: '#334155' }}>
      {l.map((x, k) => <li key={k} className="d-flex gap-2"><i className="bi bi-check2" style={{ color: '#16a34a' }} />{x}</li>)}
    </ul>
  )
}

function LignePerfectionnement({ boite, f, onEnregistrer }) {
  const { edition, v, setV, envoi, modifier, annuler, enregistrer } = useEdition(f, onEnregistrer)
  const n = x => parseFloat(x) || 0
  const ok = n(v.acompte) + n(v.tranche2) === n(v.montant)
  const nom = `${f.cours} cours`
  return (
    <div className="pb-2 mb-2" style={{ borderBottom: '1px dashed #e2e8f0' }}>
      <div className="d-flex align-items-center gap-2">
        <span className="fw-bold" style={{ color: boite.couleur, fontSize: '.88rem' }}>{nom}</span>
        {!edition && <span className="fw-bold" style={{ color: '#0f2240', fontSize: '.92rem' }}>{fcfa(n(f.montant))}</span>}
        <div className="ms-auto">
          <BoutonsFormule edition={edition} envoi={envoi} valide={ok} nom={`${nom} ${boite.label.toLowerCase()}`}
            onModifier={modifier} onAnnuler={annuler} onEnregistrer={enregistrer} />
        </div>
      </div>
      {!edition ? <Echeancier montants={[n(f.acompte), n(f.tranche2)]} /> : <>
        <div className="row g-2 mt-1">
          {[['montant', 'Montant'], ['acompte', 'Acompte'], ['tranche2', '2e tranche']].map(([k, libelle]) => (
            <div key={k} className={k === 'montant' ? 'col-12 col-sm-4' : 'col-6 col-sm-4'}>
              <label className={labelCls} style={{ fontSize: '.62rem' }}>{libelle}</label>
              <input type="number" className={inputCls} value={v[k]} min="0" step="1000" placeholder="0"
                aria-label={`${nom} ${boite.label.toLowerCase()} : ${libelle}`} style={{ paddingLeft: '.5rem', paddingRight: '.25rem' }}
                onChange={e => setV({ ...v, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="mt-1" style={{ fontSize: '.72rem', fontWeight: 600, color: ok ? '#15803d' : '#c2410c' }}>
          {ok ? <><i className="bi bi-check-circle-fill me-1" />{n(v.tranche2) ? 'En 2 fois' : 'En une fois'}</>
            : <><i className="bi bi-exclamation-triangle-fill me-1" />L'acompte et la 2e tranche font {fcfa(n(v.acompte) + n(v.tranche2))} au lieu de {fcfa(n(v.montant))}</>}
        </div>
      </>}
    </div>
  )
}

function CartePerfectionnement({ boite, lignes, onEnregistrer }) {
  return (
    <div className="p-3 h-100" style={{ border: '1.5px solid #e2e8f0', borderRadius: '1rem', background: '#fff' }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: '.6rem', background: boite.fond, color: boite.couleur }}>
          <i className={`bi bi-${boite.icone}`} />
        </div>
        <div className="fw-bold" style={{ color: '#1e293b' }}>{boite.label}</div>
      </div>
      {lignes.map(({ f, i }) => <LignePerfectionnement key={i} boite={boite} f={f} onEnregistrer={v => onEnregistrer(i, v)} />)}
    </div>
  )
}

function CarteFormule({ def, valeur, onEnregistrer }) {
  const { edition, v, setV, envoi, modifier, annuler, enregistrer } = useEdition(valeur, onEnregistrer)
  const n = k => parseFloat(v[k]) || 0
  const champs = CHAMPS_FORMULE.slice(0, def.tranches + 1)
  const total = n('acompte') + n('tranche2') + (def.tranches === 3 ? n('tranche3') : 0)
  const vide = n('montant') === 0 && total === 0
  const ok = total === n('montant')
  return (
    <div className="p-3 h-100" style={{ border: `1.5px solid ${edition ? (ok ? '#86efac' : '#fdba74') : '#e2e8f0'}`, borderRadius: '1rem', background: '#fff' }}>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <div className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: '.6rem', background: def.fond, color: def.couleur }}>
          <i className={`bi bi-${def.icone}`} />
        </div>
        <div className="fw-bold" style={{ color: '#1e293b' }}>{def.titre || def.nom}</div>
        <div className="ms-auto">
          <BoutonsFormule edition={edition} envoi={envoi} valide={ok} nom={def.titre || def.nom}
            onModifier={modifier} onAnnuler={annuler} onEnregistrer={enregistrer} />
        </div>
      </div>
      {!edition ? (
        vide ? <div className="mt-3" style={{ color: '#94a3b8', fontSize: '.85rem', fontWeight: 600 }}>À renseigner : cliquez sur Modifier</div> : <>
          <div className="mt-2 fw-bold" style={{ color: def.couleur, fontSize: '1.35rem' }}>{fcfa(n('montant'))}</div>
          <Echeancier montants={[n('acompte'), n('tranche2'), def.tranches === 3 ? n('tranche3') : 0]} />
          <ContenuFormule lignes={v.contenu} />
        </>
      ) : <>
        <div className="row g-2 mt-2">
          {champs.map(([k, libelle]) => (
            <div key={k} className={k === 'montant' ? 'col-12' : def.tranches === 2 ? 'col-6' : k === 'acompte' ? 'col-12 col-sm-4' : 'col-6 col-sm-4'}>
              <label className={labelCls} style={{ fontSize: '.65rem' }}>{libelle}</label>
              <input type="number" className={inputCls} value={v[k]} min="0" step="1000" placeholder="0"
                aria-label={`${def.titre || def.nom} : ${libelle}`}
                onChange={e => setV({ ...v, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <label className={labelCls} style={{ fontSize: '.65rem' }}>Ce que comprend la formule (une ligne par élément)</label>
          <textarea className={inputCls} rows={3} value={v.contenu} placeholder={'Cours de code illimités\n10 cours de conduite'}
            aria-label={`${def.titre || def.nom} : contenu`} onChange={e => setV({ ...v, contenu: e.target.value })} />
        </div>
        <div className="mt-2" style={{ fontSize: '.78rem', fontWeight: 600, color: ok ? '#15803d' : '#c2410c' }}>
          {ok ? <><i className="bi bi-check-circle-fill me-1" />Tranches : {fcfa(total)}</>
            : <><i className="bi bi-exclamation-triangle-fill me-1" />Les tranches font {fcfa(total)} au lieu de {fcfa(n('montant'))}</>}
        </div>
      </>}
    </div>
  )
}

function UploadZone({ label, value, onUploaded, accept = 'image/*' }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile('/admin/upload/image', file)
      onUploaded(res.url)
    } catch (err) {
      toast(err.message || 'Erreur upload', 'danger')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {value ? (
          <img src={value} alt={label}
            style={{ height: 64, maxWidth: 140, objectFit: 'contain', borderRadius: '.6rem',
              border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: 6 }} />
        ) : (
          <div style={{ height: 64, width: 100, borderRadius: '.6rem', border: '1.5px dashed #e2e8f0',
            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-image text-slate-300" style={{ fontSize: '1.4rem' }} />
          </div>
        )}
        <div>
          <button type="button"
            className="btn btn-light btn-sm fw-semibold d-flex align-items-center gap-2"
            style={{ borderRadius: '.6rem' }}
            onClick={() => ref.current?.click()}
            disabled={uploading}>
            {uploading
              ? <><span className="spinner-border spinner-border-sm" />Chargement…</>
              : <><i className="bi bi-upload" />{value ? 'Remplacer' : 'Choisir un fichier'}</>}
          </button>
          {value && (
            <button type="button"
              className="btn btn-sm mt-1 d-flex align-items-center gap-1"
              style={{ color: '#dc2626', background: 'none', border: 'none', padding: '0', fontSize: '.78rem' }}
              onClick={() => onUploaded('')}>
              <i className="bi bi-trash3" />Supprimer
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </div>
  )
}

/* ── Bureaux : chaque auto-école crée les siens ; un bureau fermé garde ses élèves mais n'en
   reçoit plus. Le principal suit les inscriptions en ligne. Enregistré tout de suite. ── */
const BUREAU_VIDE = { nom: '', adresse: '', telephone: '', localisation: '', actif: true, principal: false }

function SectionBureaux() {
  const { tous } = useBureaux()
  const [edition, setEdition] = useState(null)   // { id?, ...champs } : bureau en cours de saisie
  const [envoi, setEnvoi] = useState(false)
  const champ = (k, v) => setEdition(e => ({ ...e, [k]: v }))

  async function enregistrer() {
    if (!edition.nom.trim()) return toast('Indiquez le nom du bureau', 'warning')
    setEnvoi(true)
    try {
      const corps = { nom: edition.nom, adresse: edition.adresse, telephone: edition.telephone,
        localisation: edition.localisation, actif: edition.actif, principal: edition.principal }
      if (edition.id) await api('PUT', `/admin/bureaux/${edition.id}`, corps)
      else await api('POST', '/admin/bureaux', corps)
      await rechargerBureaux()
      toast(edition.id ? 'Bureau enregistré' : 'Bureau ajouté')
      setEdition(null)
    } catch (e) { toast(e.message, 'danger') }
    finally { setEnvoi(false) }
  }

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
      <div className="card-body p-0">
        <div className="d-flex align-items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,.1)', color: '#047857', width: 38, height: 38, borderRadius: '.75rem' }}>
            <i className="bi bi-geo-alt-fill" />
          </div>
          <div className="flex-1">
            <div className="fw-bold" style={{ color: '#1e293b' }}>Bureaux</div>
            <div className="text-slate-400" style={{ fontSize: '.82rem' }}>Rattachement des élèves, page d'accueil (adresse, numéro, itinéraire)</div>
          </div>
          {!edition && (
            <button type="button" className="btn btn-sm fw-bold" onClick={() => setEdition({ ...BUREAU_VIDE })}
              style={{ background: '#ecfdf5', color: '#047857', borderRadius: 999, border: '1px solid #a7f3d0' }}>
              <i className="bi bi-plus-lg me-1" />Ajouter
            </button>
          )}
        </div>

        <div className="px-5 py-3">
          {tous.length === 0 && !edition && (
            <div className="text-sm text-slate-500 py-2">Aucun bureau pour l'instant. Ajoutez-en au moins un : c'est là que les élèves sont rattachés.</div>
          )}
          {tous.map(b => (edition?.id === b.id ? null : (
            <div key={b.id} className="d-flex align-items-start gap-3 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <i className="bi bi-building mt-1" style={{ color: b.actif ? '#1e3a5f' : '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <div className="fw-bold" style={{ color: b.actif ? '#1e293b' : '#94a3b8' }}>
                  {b.nom}
                  {b.principal && b.actif && <span className="badge ms-2" style={{ background: '#fef3c7', color: '#92400e' }}>Inscriptions en ligne</span>}
                  {!b.actif && <span className="badge ms-2" style={{ background: '#f1f5f9', color: '#64748b' }}>Fermé</span>}
                </div>
                <div className="text-xs text-slate-500">{[b.adresse, b.telephone].filter(Boolean).join(' · ') || 'Ni adresse ni numéro'}</div>
              </div>
              {!edition && (
                <button type="button" className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: 999 }}
                  onClick={() => setEdition({ ...BUREAU_VIDE, ...b, adresse: b.adresse || '', telephone: b.telephone || '', localisation: b.localisation || '' })}>
                  <i className="bi bi-pencil me-1" />Modifier
                </button>
              )}
            </div>
          )))}

          {edition && (
            <div className="rounded-xl p-3 my-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="row g-3">
                <div className="col-12">
                  <label className={labelCls}>Nom du bureau *</label>
                  <input className={inputCls} value={edition.nom} placeholder="Ex : Thiès centre" onChange={e => champ('nom', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className={labelCls}>Adresse</label>
                  <input className={inputCls} value={edition.adresse} placeholder="Ex : En face de la gare routière" onChange={e => champ('adresse', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className={labelCls}>Téléphone</label>
                  <input className={inputCls} value={edition.telephone} placeholder="Ex : 77 123 45 67" onChange={e => champ('telephone', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className={labelCls}>Position GPS (facultatif)</label>
                  <input className={inputCls} value={edition.localisation} placeholder="Ex : 14.7017,-17.4469" onChange={e => champ('localisation', e.target.value)} />
                  <div className="text-xs text-slate-400 mt-1">Pour un itinéraire exact ; sinon on cherche l'adresse.</div>
                </div>
                <div className="col-12 d-flex flex-wrap gap-4">
                  <label className="d-flex align-items-center gap-2 text-sm fw-semibold mb-0" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" className="form-check-input m-0" checked={edition.actif} onChange={e => champ('actif', e.target.checked)} />Bureau ouvert
                  </label>
                  <label className="d-flex align-items-center gap-2 text-sm fw-semibold mb-0" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" className="form-check-input m-0" checked={edition.principal} onChange={e => champ('principal', e.target.checked)} />Suit les inscriptions en ligne
                  </label>
                </div>
                {!edition.actif && edition.id && (
                  <div className="col-12 text-xs" style={{ color: '#92400e' }}><i className="bi bi-info-circle me-1" />Fermé : ses élèves y restent rattachés, mais aucun nouvel élève ne pourra y être inscrit.</div>
                )}
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-light fw-semibold" style={{ borderRadius: '.75rem' }} onClick={() => setEdition(null)} disabled={envoi}>Annuler</button>
                <button type="button" className="btn fw-bold" onClick={enregistrer} disabled={envoi}
                  style={{ background: 'linear-gradient(135deg,#d4a017,#f0bb2a)', color: '#1e3a5f', borderRadius: '.75rem', border: 'none' }}>
                  {envoi ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check2-circle me-1" />Enregistrer</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Parametres() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    nom: '', adresse: '', telephone: '', email: '',
    logoUrl: '', signatureUrl: '',
    tarifInscription: '', tarifHeureCode: '', tarifHeureConduite: '',
    lienWave: '', lienOrangeMoney: '', moniteurParDefautId: '',
    ville: '', anneeCreation: '', elevesFormes: '', tauxReussite: '', nombreMoniteurs: '', horaires: '',
    slogan: '', affiches: [], palmaresHebdo: true,
  })
  const [formules, setFormules] = useState(formulesDepuis([]))
  const [formulesPerf, setFormulesPerf] = useState([])
  const [formulesPL, setFormulesPL] = useState(formulesDepuis([], [FORMULE_POIDS_LOURD]))
  const [formulesMoto, setFormulesMoto] = useState(formulesDepuis([], [FORMULE_MOTO]))
  const [moniteurs, setMoniteurs] = useState([])
  const [applying, setApplying]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api('GET', '/admin/config')
      .then(data => { setFormules(formulesDepuis(data.formules)); setFormulesPL(formulesDepuis(data.formulesPoidsLourd, [FORMULE_POIDS_LOURD])); setFormulesMoto(formulesDepuis(data.formulesMoto, [FORMULE_MOTO])); setFormulesPerf(data.formulesPerfectionnement || []); setForm({
        nom:               data.nom               || '',
        adresse:           data.adresse           || '',
        telephone:         data.telephone         || '',
        email:             data.email             || '',
        logoUrl:           data.logoUrl           || '',
        signatureUrl:      data.signatureUrl      || '',
        tarifInscription:  data.tarifInscription  ?? '',
        tarifHeureCode:    data.tarifHeureCode    ?? '',
        tarifHeureConduite:data.tarifHeureConduite ?? '',
        lienWave:          data.lienWave          || '',
        lienOrangeMoney:   data.lienOrangeMoney   || '',
        moniteurParDefautId: data.moniteurParDefautId ?? '',
        ville:             data.ville             || '',
        anneeCreation:     data.anneeCreation     ?? '',
        elevesFormes:      data.elevesFormes      || '',
        tauxReussite:      data.tauxReussite      || '',
        nombreMoniteurs:   data.nombreMoniteurs   || '',
        horaires:          data.horaires          || '',
        slogan:            data.slogan            || '',
        affiches:          data.affiches          || [],
        palmaresHebdo:     data.palmaresHebdo !== false,
      }) })
      .catch(e => toast(e.message, 'danger'))
      .finally(() => setLoading(false))
    api('GET', '/moniteurs/actifs').then(setMoniteurs).catch(() => {})
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // Enregistre d'abord le moniteur choisi (seul ce champ) : le bouton ne dépend pas de « Sauvegarder ».
  async function appliquerMoniteur() {
    const m = moniteurs.find(x => String(x.id) === String(form.moniteurParDefautId))
    if (!m) { toast('Choisissez d\'abord un moniteur par défaut', 'warning'); return }
    if (!(await confirmer({ titre: `Assigner ${m.prenom} ${m.nom} ?`, ton: 'alerte', icone: 'people-fill', libelle: 'Assigner',
      message: "Il sera donné à tous les élèves actifs qui n'ont pas de moniteur. Les autres élèves ne changent pas." }))) return
    setApplying(true)
    try {
      await api('PUT', '/admin/config', { moniteurParDefautId: form.moniteurParDefautId })
      const r = await api('POST', '/admin/config/moniteur-par-defaut/appliquer')
      toast(r.eleves ? `${r.moniteur} assigné à ${r.eleves} élève${r.eleves > 1 ? 's' : ''}` : 'Tous les élèves ont déjà un moniteur')
    } catch (e) { toast(e.message, 'danger') }
    finally { setApplying(false) }
  }

  // Les listes au format du serveur
  const versPermis = fs => fs.map(f => ({ nom: f.nom, ...Object.fromEntries(['montant', 'acompte', 'tranche2', 'tranche3'].map(k => [k, parseFloat(f[k]) || 0])),
    contenu: (f.contenu || '').split('\n').map(x => x.trim()).filter(Boolean) }))
  const versServeur = (fs, fps, fpl = formulesPL, fm = formulesMoto) => ({
    formules: versPermis(fs),
    formulesPoidsLourd: versPermis(fpl),
    formulesMoto: versPermis(fm),
    formulesPerfectionnement: fps.map(f => ({ boite: f.boite, cours: f.cours, ...Object.fromEntries(['montant', 'acompte', 'tranche2'].map(k => [k, parseFloat(f[k]) || 0])) })),
  })
  // Enregistre une seule formule tout de suite ; le serveur vérifie que les tranches font le montant
  async function enregistrerFormules(fs, fps, libelle, fpl, fm) {
    const cfg = await api('PUT', '/admin/config', versServeur(fs, fps, fpl, fm))
    setFormules(formulesDepuis(cfg.formules)); setFormulesPerf(cfg.formulesPerfectionnement || [])
    setFormulesPL(formulesDepuis(cfg.formulesPoidsLourd, [FORMULE_POIDS_LOURD])); setFormulesMoto(formulesDepuis(cfg.formulesMoto, [FORMULE_MOTO]))
    toast(`${libelle} enregistrée`)
  }

  async function publierChampions() {
    try {
      const r = await api('POST', '/admin/palmares/publier')
      toast(r.seances > 0 ? `Annonce publiée : ${r.seances} séance(s) à l'honneur` : "Rien à publier : aucun quiz la semaine passée, ou son annonce est déjà publiée", r.seances > 0 ? 'success' : 'warning')
    } catch (e) { toast(e.message, 'danger') }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api('PUT', '/admin/config', {
        ...form,
        tarifInscription:   parseFloat(form.tarifInscription)   || 0,
        tarifHeureCode:     parseFloat(form.tarifHeureCode)     || 0,
        tarifHeureConduite: parseFloat(form.tarifHeureConduite) || 0,
        ...versServeur(formules, formulesPerf),
      })
      rechargerEcole()   // nouveau nom affiché partout sans recharger la page
      toast('Paramètres enregistrés avec succès')
    } catch (e) {
      toast(e.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Chargement…
    </div>
  )

  return (
    <div data-saisie style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 780 }}>

      {/* En-tête */}
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Paramètres</h2>
        <p className="text-sm text-slate-400 mt-0.5">Configuration de votre établissement</p>
      </div>

      {/* Section : Informations */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          {/* Header section */}
          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="w-9 h-9 rounded-xl d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(30,58,95,.1)', color: '#1e3a5f', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-building" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Détails de votre établissement</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>Informations affichées sur vos documents</div>
            </div>
          </div>

          {/* Champs */}
          <div className="px-5 py-4">
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className={labelCls}>Nom de l'auto-école</label>
                <input className={inputCls} value={form.nom}
                  placeholder="Ex : Auto-École Excellence"
                  onChange={e => set('nom', e.target.value)} />
              </div>
              <div className="col-12">
                <label className={labelCls}>Adresse complète</label>
                <input className={inputCls} value={form.adresse}
                  placeholder="Ex : 12 Rue des Jacarandas, Dakar"
                  onChange={e => set('adresse', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className={labelCls}>Téléphone</label>
                <input className={inputCls} value={form.telephone}
                  placeholder="Ex : 77 123 45 67"
                  onChange={e => set('telephone', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.email}
                  placeholder="contact@autoecole.sn"
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            {/* Textes de la page d'accueil publique : un champ vide n'y apparaît pas */}
            <div className="text-sm font-extrabold text-slate-700 mb-1"><i className="bi bi-globe2 me-2" />Page d'accueil du site</div>
            <div className="text-xs text-slate-400 mb-3">Affiché aux visiteurs. Laissez vide ce que vous ne voulez pas montrer.</div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className={labelCls}>Ville</label>
                <input className={inputCls} value={form.ville} placeholder="Ex : Dakar" onChange={e => set('ville', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className={labelCls}>Année de création</label>
                <input className={inputCls} inputMode="numeric" value={form.anneeCreation} placeholder="Ex : 2016" onChange={e => set('anneeCreation', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Élèves formés</label>
                <input className={inputCls} value={form.elevesFormes} placeholder="Ex : 12 000+" onChange={e => set('elevesFormes', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Taux de réussite</label>
                <input className={inputCls} value={form.tauxReussite} placeholder="Ex : 94 %" onChange={e => set('tauxReussite', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Moniteurs</label>
                <input className={inputCls} value={form.nombreMoniteurs} placeholder="Ex : 15+" onChange={e => set('nombreMoniteurs', e.target.value)} />
              </div>
              <div className="col-12">
                <label className={labelCls}>Horaires d'ouverture</label>
                <input className={inputCls} value={form.horaires} placeholder="Ex : Lun – Sam : 8h00 – 18h00" onChange={e => set('horaires', e.target.value)} />
              </div>
              <div className="col-12">
                <label className={labelCls}>Slogan</label>
                <input className={inputCls} value={form.slogan} maxLength={300} placeholder="Ex : La confiance au volant, la réussite au rendez-vous" onChange={e => set('slogan', e.target.value)} />
                <div className="text-xs text-slate-400 mt-1">En grand en haut de l'accueil ; la partie après la virgule s'affiche en doré. Vide : « Votre permis de conduire, en toute confiance ».</div>
              </div>
              <div className="col-12">
                <label className={labelCls}>Affiches (diaporama « Nos formations »)</label>
                {form.affiches.length === 0 && <div className="text-xs text-slate-400 mb-2">Aucune affiche : la section n'apparaît pas sur l'accueil.</div>}
                <div className="space-y-2 mb-2">
                  {form.affiches.map((a, i) => (
                    <div key={a.url} className="d-flex align-items-center gap-3 p-2 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <img src={a.url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                      <input className={inputCls} value={a.titre} placeholder="Légende de l'affiche"
                        onChange={e => set('affiches', form.affiches.map((x, j) => (j === i ? { ...x, titre: e.target.value } : x)))} />
                      <button type="button" className="btn btn-sm btn-light" title="Monter" disabled={i === 0}
                        onClick={() => { const l = [...form.affiches]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; set('affiches', l) }}><i className="bi bi-arrow-up" /></button>
                      <button type="button" className="btn btn-sm btn-light" title="Retirer" style={{ color: '#b91c1c' }}
                        onClick={() => set('affiches', form.affiches.filter((_, j) => j !== i))}><i className="bi bi-trash3" /></button>
                    </div>
                  ))}
                </div>
                {form.affiches.length < 20 && (
                  <UploadZone label="Ajouter une affiche" value="" onUploaded={url => set('affiches', [...form.affiches, { url, titre: '' }])} />
                )}
                <div className="text-xs text-slate-400 mt-1">Pensez à « Enregistrer » en bas de la page.</div>
              </div>
            </div>

            {/* Motivation : annonce hebdomadaire des meilleurs scores aux quiz des séances */}
            <div className="text-sm font-extrabold text-slate-700 mb-1"><i className="bi bi-trophy me-2" />Champions de la semaine</div>
            <div className="text-xs text-slate-400 mb-3">Chaque lundi à 00 h, une annonce félicite le meilleur score au quiz de chaque séance de la semaine écoulée (prénom et nom), pour tous les élèves.</div>
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <label className="d-flex align-items-center gap-2 text-sm fw-semibold mb-0" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="form-check-input m-0" checked={form.palmaresHebdo} onChange={e => set('palmaresHebdo', e.target.checked)} />
                Publier l'annonce chaque lundi
              </label>
              <button type="button" className="btn btn-sm btn-light fw-semibold" style={{ borderRadius: 999 }} onClick={publierChampions}>
                <i className="bi bi-megaphone me-1" />Publier la semaine passée maintenant
              </button>
            </div>

          </div>
        </div>
      </div>

      <SectionBureaux />

      {/* Section : Tarification */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(74,222,128,.15)', color: '#16a34a', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-cash-stack" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Tarification</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>Montants en FCFA</div>
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '.92rem' }}>
              <i className="bi bi-award me-2" style={{ color: '#d4a017' }} />Formules du permis B
            </div>
            <div className="text-slate-400 mb-3" style={{ fontSize: '.8rem' }}>
              Montant de chaque formule et son échéancier. « Modifier » pour changer une formule, « Enregistrer » la sauvegarde aussitôt.
            </div>
            <div className="row g-3">
              {FORMULES.map((def, i) => (
                <div key={def.nom} className="col-md-6">
                  <CarteFormule def={def} valeur={formules[i]}
                    onEnregistrer={v => enregistrerFormules(formules.map((x, j) => j === i ? v : x), formulesPerf, `Formule ${def.nom}`)} />
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '.92rem' }}>
              <i className="bi bi-truck-front me-2" style={{ color: '#d4a017' }} />Permis A, C et D
            </div>
            <div className="text-slate-400 mb-3" style={{ fontSize: '.8rem' }}>
              Une seule formule pour la moto, et une seule pour le poids lourd et le transport en commun.
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <CarteFormule def={FORMULE_MOTO} valeur={formulesMoto[0]}
                  onEnregistrer={v => enregistrerFormules(formules, formulesPerf, 'Formule du permis A', undefined, [v])} />
              </div>
              <div className="col-md-6">
                <CarteFormule def={FORMULE_POIDS_LOURD} valeur={formulesPL[0]}
                  onEnregistrer={v => enregistrerFormules(formules, formulesPerf, 'Formule des permis C et D', [v])} />
              </div>
            </div>
          </div>

          {formulesPerf.length > 0 && <div className="px-5 pt-4">
            <div className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '.92rem' }}>
              <i className="bi bi-speedometer2 me-2" style={{ color: '#d4a017' }} />Formules perfectionnement
            </div>
            <div className="text-slate-400 mb-3" style={{ fontSize: '.8rem' }}>
              Conduite seule. 2e tranche à 0 : tout se paie à l'inscription.
            </div>
            <div className="row g-3">
              {BOITES_PERF.map(b => (
                <div key={b.v} className="col-md-6">
                  <CartePerfectionnement boite={b}
                    lignes={formulesPerf.map((f, i) => ({ f, i })).filter(x => x.f.boite === b.v)}
                    onEnregistrer={(i, v) => enregistrerFormules(formules, formulesPerf.map((x, j) => j === i ? v : x), `Formule ${v.cours} cours`)} />
                </div>
              ))}
            </div>
          </div>}

          <div className="px-5 py-4">
            <div className="fw-bold mb-3" style={{ color: '#1e293b', fontSize: '.92rem' }}>
              <i className="bi bi-tags me-2" style={{ color: '#16a34a' }} />Autres tarifs
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className={labelCls}>Tarif inscription</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifInscription} min="0"
                    placeholder="0"
                    onChange={e => set('tarifInscription', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Tarif heure code</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifHeureCode} min="0"
                    placeholder="0"
                    onChange={e => set('tarifHeureCode', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
              <div className="col-md-4">
                <label className={labelCls}>Tarif heure de conduite</label>
                <div className="input-group">
                  <input type="number" className={inputCls} value={form.tarifHeureConduite} min="0"
                    placeholder="0"
                    onChange={e => set('tarifHeureConduite', e.target.value)} />
                  <span className="input-group-text" style={{ fontSize: '.8rem', color: '#64748b' }}>FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section : Inscriptions */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(212,160,23,.15)', color: '#b45309', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-person-badge" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Inscriptions</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>
                Moniteur assigné d'office aux nouveaux élèves (formulaire et import Excel).
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label className={labelCls}>Moniteur par défaut</label>
                <select className={inputCls} value={form.moniteurParDefautId}
                  onChange={e => set('moniteurParDefautId', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {moniteurs.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <button type="button" className="btn fw-semibold w-100" disabled={applying}
                  onClick={appliquerMoniteur}
                  style={{ borderRadius: '.75rem', background: '#fef9c3', color: '#854d0e', border: '1.5px solid #fde68a' }}>
                  {applying ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-people-fill me-1" />}
                  Assigner aux élèves sans moniteur
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section : Paiement mobile */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '1.1rem' }}>
        <div className="card-body p-0">

          <div className="d-flex align-items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ background: 'rgba(29,200,255,.15)', color: '#0284c7', width: 38, height: 38, borderRadius: '.75rem' }}>
              <i className="bi bi-phone" />
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#1e293b' }}>Paiement mobile</div>
              <div className="text-slate-400" style={{ fontSize: '.82rem' }}>
                Liens marchands proposés aux élèves dans « Mes Paiements ». Laisser vide pour masquer.
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="row g-3">
              <div className="col-12">
                <label className={labelCls}>Lien de paiement Wave</label>
                <input type="url" className={inputCls} value={form.lienWave}
                  placeholder="https://pay.wave.com/m/…"
                  onChange={e => set('lienWave', e.target.value)} />
              </div>
              <div className="col-12">
                <label className={labelCls}>Lien de paiement Orange Money</label>
                <input type="url" className={inputCls} value={form.lienOrangeMoney}
                  placeholder="https://…"
                  onChange={e => set('lienOrangeMoney', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comptes administrateurs et du secrétariat : enregistrés tout de suite, indépendants du bouton Sauvegarder.
          Les comptes administrateurs ne se gèrent que par le super admin (refusé aussi par le serveur). */}
      {user?.role === 'SUPER_ADMIN' && <ComptesSecretariat type="admin" />}
      <ComptesSecretariat />

      {/* Bouton Sauvegarder */}
      <div className="d-flex justify-content-end">
        <button
          className="btn fw-bold text-white px-5 py-2"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', borderRadius: '.75rem', border: 'none' }}
          onClick={handleSave}
          disabled={saving}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement…</>
            : <><i className="bi bi-check-lg me-2" />Sauvegarder</>}
        </button>
      </div>
    </div>
  )
}
