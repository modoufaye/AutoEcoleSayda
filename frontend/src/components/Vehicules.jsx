import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import Pagination from './Pagination'
import { FenetreModerne, Etape, Etiquette, Choix, ChampMontant } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import { EnteteListe, LigneListe, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, Reinitialiser } from './ListeModerne'
import '../landing.css'

const PAGE_SIZE = 10

const EMPTY = {
  immatriculation: '', marque: '', modele: '',
  annee: new Date().getFullYear(), categorie: '',
  kilometrage: 0, statut: 'DISPONIBLE', observations: '',
  prochainEntretien: '',
  dateAssurance: '', montantAssurance: '', dureeAssurance: '',
  dateVisiteTechnique: '',
}

function expiryDate(dateStr, months) {
  if (!dateStr || !months) return null
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + parseInt(months))
  return d.toISOString().split('T')[0]
}

function entretienStyle(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr)
  const diff = Math.floor((d - today) / 86400000)
  if (diff < 0)  return { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'En retard' }
  if (diff <= 15) return { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Bientôt' }
  return { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'OK' }
}

const STATUT_V = {
  DISPONIBLE:     { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Disponible' },
  EN_COURS:       { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', label: 'En cours' },
  EN_MAINTENANCE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En maintenance' },
  HORS_SERVICE:   { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Hors service' },
}



export default function Vehicules({ onBack }) {
  // Le moniteur consulte et modifie les véhicules, mais ne peut ni en ajouter ni en supprimer.
  const { user } = useAuth()
  const isMoniteur = user?.role === 'MONITEUR'
  const [list, setList]               = useState([])
  const [filtered, setFiltered]       = useState([])
  const [statutFilter, setStatutFilter] = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [search, setSearch]           = useState('')
  const [form, setForm]               = useState(EMPTY)
  const [editId, setEditId]           = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [profil, setProfil]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('GET', '/vehicules')
      setList(data); setFiltered(data)
    } catch { toast('Erreur chargement véhicules', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = list
    if (statutFilter) result = result.filter(v => v.statut === statutFilter)
    if (catFilter)    result = result.filter(v => v.categorie === catFilter)
    // Recherche sur l'immatriculation (sans tenir compte des tirets ni des espaces), la marque et le modèle
    const q = search.trim().toLowerCase()
    if (q) {
      const sans = s => (s || '').toLowerCase().replace(/[\s-]/g, '')
      result = result.filter(v => sans(v.immatriculation).includes(sans(q))
        || `${v.marque || ''} ${v.modele || ''}`.toLowerCase().includes(q))
    }
    setFiltered(result)
    setPage(1)
  }, [statutFilter, catFilter, search, list])

  const openModal = (v = null) => {
    if (v) {
      setEditId(v.id)
      setForm({
        immatriculation: v.immatriculation, marque: v.marque, modele: v.modele,
        annee: v.annee, categorie: v.categorie, kilometrage: v.kilometrage,
        statut: v.statut, observations: v.observations || '',
        prochainEntretien: v.prochainEntretien || '',
        dateAssurance: v.dateAssurance || '', montantAssurance: v.montantAssurance ?? '',
        dureeAssurance: v.dureeAssurance ?? '', dateVisiteTechnique: v.dateVisiteTechnique || '',
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const save = async () => {
    const { immatriculation, marque, modele, annee, categorie } = form
    if (!immatriculation || !marque || !modele || !annee || !categorie) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    const data = { ...form, observations: form.observations || null }
    try {
      if (editId) { await api('PUT', `/vehicules/${editId}`, data); toast('Véhicule modifié') }
      else        { await api('POST', '/vehicules', data);          toast('Véhicule créé') }
      setShowModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer ce véhicule ?', ton: 'danger', libelle: 'Supprimer', message: 'Cette action est définitive.' }))) return
    try { await api('DELETE', `/vehicules/${id}`); toast('Véhicule supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Moniteur : même disposition que « Mes élèves » : Retour, puis la barre de filtres, sans titre */}
      {onBack && (
        <button onClick={onBack} className="btn-retour">
          <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>Retour
        </button>
      )}

      {/* ── En-tête de page ─────────────────────────────────── */}
      {!isMoniteur && <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight">Gestion des Véhicules</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gérez votre flotte de véhicules et leur entretien</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-0 cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.3)' }}>
          <i className="bi bi-plus-lg" style={{ fontSize: '.9rem' }} />
          Véhicule
        </button>
      </div>}

      {/* ── Barre de filtres ─────────────────────────────────── */}
      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder="Immatriculation, marque, modèle…" />
        <Filtre icone="funnel" value={statutFilter} onChange={setStatutFilter}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_V).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </Filtre>
        <Filtre icone="award" value={catFilter} onChange={setCatFilter}>
          <option value="">Toutes catégories</option>
          {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>Permis {c}</option>)}
        </Filtre>
        {(search || statutFilter || catFilter) && <Reinitialiser onClick={() => { setSearch(''); setStatutFilter(''); setCatFilter('') }} />}
      </BarreFiltres>

      {/* ── Liste des véhicules ───────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="car-front-fill" titre="Véhicules" sousTitre="Flotte de l'auto-école" nombre={filtered.length} />
        {loading ? <ListeChargement />
          : filtered.length === 0 ? <ListeVide texte="Aucun véhicule enregistré" icone="car-front" />
          : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(v => {
            const st = STATUT_V[v.statut] || { bg: '#f1f5f9', color: '#64748b', label: v.statut }
            const assuranceExpiry = expiryDate(v.dateAssurance, v.dureeAssurance)
            const finVisite = v.dateVisiteTechnique
              ? new Date(new Date(v.dateVisiteTechnique).setFullYear(new Date(v.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
              : null
            const fmt = d => new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
            // Échéance : libellé, date et pastille OK / Bientôt / En retard.
            const echeance = (libelle, icone, date) => {
              const s = entretienStyle(date)
              return (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 whitespace-nowrap"><i className={`bi bi-${icone} me-1`} />{libelle}</span>
                  {date ? (
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-slate-700 whitespace-nowrap">{fmt(date)}</span>
                      {s && <span className="w-2 h-2 rounded-full flex-shrink-0" title={s.label} style={{ background: s.dot }} />}
                    </span>
                  ) : <span className="text-slate-300 italic">Non défini</span>}
                </div>
              )
            }
            const icone = { A: 'scooter', B: 'car-front-fill', C: 'truck-front-fill', D: 'bus-front-fill' }[v.categorie] || 'car-front-fill'
            return (
              <LigneListe key={v.id} attenue={v.statut === 'HORS_SERVICE'}>
                {/* Identification */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 flex flex-col items-center justify-center flex-shrink-0"
                    style={{ borderRadius: '.85rem', background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', color: '#fff' }}>
                    <i className={`bi bi-${icone}`} style={{ fontSize: '1rem' }} />
                    <span className="text-[9px] font-extrabold leading-none mt-0.5" style={{ color: '#f0bb2a' }}>{v.categorie}</span>
                  </div>
                  <div className="min-w-0">
                    <button onClick={() => setProfil(v)}
                      className="block text-left font-bold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-full"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                      {v.immatriculation}
                    </button>
                    <div className="text-xs text-slate-500 truncate">{v.marque} {v.modele} · {v.annee}</div>
                  </div>
                </div>

                {/* Entretien et visite technique */}
                <div className="min-w-0 space-y-1">
                  {echeance('Entretien', 'wrench-adjustable', v.prochainEntretien)}
                  {echeance('Visite technique', 'clipboard-check', finVisite)}
                </div>

                {/* Assurance et kilométrage */}
                <div className="min-w-0 space-y-1">
                  {echeance('Assurance', 'shield-check', assuranceExpiry)}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500"><i className="bi bi-speedometer2 me-1" />Kilométrage</span>
                    <span className="font-semibold text-slate-700 whitespace-nowrap">{Number(v.kilometrage || 0).toLocaleString('fr-FR')} km</span>
                  </div>
                </div>

                {/* Statut et actions */}
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <Pastille couleur={st.color} fond={st.bg}>{st.label}</Pastille>
                  <div className="flex items-center gap-1.5">
                    <BoutonRond title="Voir le véhicule" icon="eye-fill" couleur="#1e3a5f" fond="#eff6ff" onClick={() => setProfil(v)} />
                    <BoutonRond title="Modifier" icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => openModal(v)} />
                    {!isMoniteur && <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => del(v.id)} />}
                  </div>
                </div>
              </LigneListe>
            )
          })}
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Fenêtre ajout / modification ─────────────────────── */}
      {showModal && (() => {
        const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
        const badge = (dateStr, prefixe = '') => {
          const s = entretienStyle(dateStr)
          return s ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
              <span className="text-xs font-semibold" style={{ color: s.color }}>{prefixe}{s.label}</span>
            </div>
          ) : null
        }
        const finVisite = form.dateVisiteTechnique
          ? new Date(new Date(form.dateVisiteTechnique).setFullYear(new Date(form.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
          : null
        return (
          <FenetreModerne
            surTitre={editId ? 'Modifier le véhicule' : 'Nouveau véhicule'}
            titre={form.immatriculation || 'Nouveau véhicule'}
            icone="car-front-fill"
            details={[
              (form.marque || form.modele) && ['tag', `${form.marque} ${form.modele}`.trim()],
              form.categorie && ['award', `Permis ${form.categorie}`],
              form.annee && ['calendar3', form.annee],
            ]}
            onClose={() => setShowModal(false)} onSave={save}
            libelleSave={editId ? 'Enregistrer' : 'Ajouter le véhicule'}>
            <Etape n={1} icon="card-text" titre="Identification">
              <div className="row g-3">
                <div className="col-md-6">
                  <Etiquette requis>Immatriculation</Etiquette>
                  <input className={champCls} style={{ fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase' }}
                    value={form.immatriculation} placeholder="DK-1234-AB" onChange={e => set('immatriculation', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <Etiquette requis>Année</Etiquette>
                  <input type="number" className={champCls} value={form.annee} min="1990" max="2030"
                    onChange={e => set('annee', parseInt(e.target.value))} />
                </div>
                <div className="col-md-6">
                  <Etiquette requis>Marque</Etiquette>
                  <input className={champCls} value={form.marque} placeholder="Toyota" onChange={e => set('marque', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <Etiquette requis>Modèle</Etiquette>
                  <input className={champCls} value={form.modele} placeholder="Corolla" onChange={e => set('modele', e.target.value)} />
                </div>
              </div>
            </Etape>

            <Etape n={2} icon="speedometer2" titre="Utilisation">
              <Etiquette requis>Catégorie de permis</Etiquette>
              <div className="mb-4">
                <Choix tuiles cols={4} value={form.categorie} onChange={v => set('categorie', v)} options={[
                  { v: 'A', label: 'A', icon: 'scooter',          sous: 'Moto' },
                  { v: 'B', label: 'B', icon: 'car-front-fill',   sous: 'Voiture' },
                  { v: 'C', label: 'C', icon: 'truck-front-fill', sous: 'Poids lourd' },
                  { v: 'D', label: 'D', icon: 'bus-front-fill',   sous: 'Transport' },
                ]} />
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <Etiquette>Kilométrage</Etiquette>
                  <ChampMontant suffixe="km" value={form.kilometrage} onChange={v => set('kilometrage', parseInt(v) || 0)} />
                </div>
                <div className="col-md-8">
                  <Etiquette>Statut</Etiquette>
                  <Choix cols={2} value={form.statut} onChange={v => set('statut', v)}
                    options={Object.entries(STATUT_V).map(([v, s]) => ({ v, label: s.label, color: s.color, bg: s.bg }))} />
                </div>
              </div>
            </Etape>

            <Etape n={3} icon="calendar-check" titre="Échéances">
              <div className="row g-3">
                <div className="col-md-6">
                  <Etiquette>Prochain entretien</Etiquette>
                  <input type="date" className={champCls} value={form.prochainEntretien} onChange={e => set('prochainEntretien', e.target.value)} />
                  {form.prochainEntretien && badge(form.prochainEntretien)}
                </div>
                <div className="col-md-6">
                  <Etiquette>Visite technique</Etiquette>
                  <input type="date" className={champCls} value={form.dateVisiteTechnique} onChange={e => set('dateVisiteTechnique', e.target.value)} />
                  {finVisite && badge(finVisite, `Expire le ${new Date(finVisite).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })} — `)}
                </div>
                <div className="col-md-4">
                  <Etiquette>Assurance (début)</Etiquette>
                  <input type="date" className={champCls} value={form.dateAssurance} onChange={e => set('dateAssurance', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <Etiquette>Durée</Etiquette>
                  <ChampMontant suffixe="mois" min={1} placeholder="12" value={form.dureeAssurance} onChange={v => set('dureeAssurance', v)} />
                </div>
                <div className="col-md-4">
                  <Etiquette>Montant assurance</Etiquette>
                  <ChampMontant placeholder="0" value={form.montantAssurance} onChange={v => set('montantAssurance', v)} />
                </div>
                <div className="col-12">
                  <Etiquette>Observations</Etiquette>
                  <textarea className={champCls} rows="2" value={form.observations} style={{ resize: 'vertical' }}
                    onChange={e => set('observations', e.target.value)} />
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}
      {/* ── Modal Profil ─────────────────────────────────────── */}
      {profil && (() => {
        const st = STATUT_V[profil.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: profil.statut }
        const ent = entretienStyle(profil.prochainEntretien)
        const assuranceExpiry = expiryDate(profil.dateAssurance, profil.dureeAssurance)
        const assuranceSt = entretienStyle(assuranceExpiry)
        const visiteNext = profil.dateVisiteTechnique
          ? new Date(new Date(profil.dateVisiteTechnique).setFullYear(new Date(profil.dateVisiteTechnique).getFullYear() + 1)).toISOString().split('T')[0]
          : null
        const visiteSt = entretienStyle(visiteNext)
        const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

        return (
          <div className="modal show d-block" style={{ background: 'rgba(15,34,64,.55)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0" style={{ borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,.25)' }}>

                {/* Bannière */}
                <div className="px-6 pt-6 pb-5 relative" style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)' }}>
                  <button className="btn-close btn-close-white position-absolute top-4 end-4" onClick={() => setProfil(null)} />
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,.2)' }}>
                      <i className="bi bi-car-front-fill" style={{ fontSize: '1.6rem', color: '#fff' }} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(209,250,229,.7)' }}>Profil véhicule</div>
                      <div className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: 'ui-monospace,monospace' }}>
                        {profil.immatriculation}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: 'rgba(209,250,229,.85)' }}>{profil.marque} {profil.modele} — {profil.annee}</div>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-body px-6 py-5" style={{ background: '#f8fafc' }}>
                  <div className="row g-4">

                    {/* Infos générales */}
                    <div className="col-12">
                      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-info-circle me-1" />Informations générales
                        </div>
                        <div className="row g-3">
                          {[
                            { label: 'Catégorie', value: profil.categorie, icon: 'tag' },
                            { label: 'Kilométrage', value: `${profil.kilometrage?.toLocaleString('fr-SN')} km`, icon: 'speedometer2' },
                            { label: 'Observations', value: profil.observations || '—', icon: 'chat-left-text' },
                          ].map(({ label, value, icon }) => (
                            <div key={label} className="col-md-4">
                              <div className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                                <i className={`bi bi-${icon}`} />
                                {label}
                              </div>
                              <div className="text-sm font-semibold text-slate-800">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Assurance */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-shield-check me-1" />Assurance
                        </div>
                        {profil.dateAssurance ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Date de souscription</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.dateAssurance)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Durée</div>
                              <div className="text-sm font-semibold text-slate-800">{profil.dureeAssurance ? `${profil.dureeAssurance} mois` : '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Expiration</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(assuranceExpiry)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Montant</div>
                              <div className="text-sm font-semibold text-slate-800">{profil.montantAssurance ? `${profil.montantAssurance.toLocaleString('fr-SN')} F CFA` : '—'}</div>
                            </div>
                            {assuranceSt && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: assuranceSt.bg, color: assuranceSt.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: assuranceSt.dot }} />
                                {assuranceSt.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseignée</p>}
                      </div>
                    </div>

                    {/* Visite technique */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-clipboard2-check me-1" />Visite technique
                        </div>
                        {profil.dateVisiteTechnique ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Dernière visite</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.dateVisiteTechnique)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400">Prochaine visite</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(visiteNext)}</div>
                            </div>
                            {visiteSt && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: visiteSt.bg, color: visiteSt.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: visiteSt.dot }} />
                                {visiteSt.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseignée</p>}
                      </div>
                    </div>

                    {/* Prochain entretien */}
                    <div className="col-md-4">
                      <div className="bg-white rounded-2xl p-4 h-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          <i className="bi bi-tools me-1" />Prochain entretien
                        </div>
                        {profil.prochainEntretien ? (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-slate-400">Date prévue</div>
                              <div className="text-sm font-semibold text-slate-800">{fmt(profil.prochainEntretien)}</div>
                            </div>
                            {ent && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: ent.bg, color: ent.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ent.dot }} />
                                {ent.label}
                              </span>
                            )}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic m-0">Non renseigné</p>}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-0 px-6 pb-5 pt-2">
                  <button className="btn btn-light fw-semibold px-4" style={{ borderRadius: '.75rem' }}
                    onClick={() => setProfil(null)}>Fermer</button>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
