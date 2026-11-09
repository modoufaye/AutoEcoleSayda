import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtTime, BADGES, BUREAUX, correspond } from '../utils'
import Badge from './Badge'
import { toast } from './Toast'
import { EnteteListe, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, BoutonAjout } from './ListeModerne'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import { FenetreModerne, Etape, Etiquette, Choix } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import Pagination from './Pagination'
import ChoixPuces from './ChoixPuces'
import '../landing.css'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
// Page « Cours Conduite » : toute nouvelle leçon est une leçon de conduite (pas de champ Type)
// eleveIds : élèves cochés à la création (une leçon chacun) ; eleveId : l'élève d'une leçon modifiée
const EMPTY = { date: today(), heureDebut: '08:00', heureFin: '10:00', type: 'CONDUITE', eleveId: '', eleveIds: [], moniteurId: '', vehiculeId: '', observations: '' }


const TYPE_STYLE = {
  CODE:     { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb', label: 'Code' },
  CONDUITE: { bg: '#f0fdf4', color: '#15803d', dot: '#16a34a', label: 'Conduite' },
}

const STATUT_STYLE = {
  PLANIFIEE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'Planifiée' },
  TERMINEE:  { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Terminée' },
  ANNULEE:   { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Annulée' },
  EN_COURS:  { bg: '#eff6ff', color: '#1d4ed8', dot: '#2563eb', label: 'En cours' },
}


// « 08:30 » ↔ minutes depuis minuit (durée d'une leçon)
const minutes = h => { const [a, b] = (h || '0:0').split(':').map(Number); return a * 60 + b }
const heure = m => `${String(Math.floor(Math.min(m, 1439) / 60)).padStart(2, '0')}:${String(Math.min(m, 1439) % 60).padStart(2, '0')}`

export default function Lecons({ onBack }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'

  const [list, setList]           = useState([])
  const [site, setSite]           = useState('')
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [eleves, setEleves]       = useState([])
  const [moniteurs, setMoniteurs] = useState([])
  const [vehicules, setVehicules] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const data = isEleve
        ? await api('GET', '/eleve/mes-lecons')
        : await api('GET', '/lecons')
      setList(data)
    } catch { toast('Erreur chargement leçons', 'danger') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [site, search])

  const openModal = async (l = null) => {
    const [ev, mo, ve] = await Promise.all([
      api('GET', '/eleves'), api('GET', '/moniteurs/actifs'), api('GET', '/vehicules/disponibles')
    ])
    setEleves(ev); setMoniteurs(mo); setVehicules(ve)
    if (l) {
      setEditId(l.id)
      setForm({
        date: l.date,
        heureDebut: l.heureDebut.substring(0, 5),
        heureFin: l.heureFin.substring(0, 5),
        type: l.type,
        eleveId: l.eleve?.id || '',
        moniteurId: l.moniteur?.id || '',
        vehiculeId: l.vehicule?.id || '',
        observations: l.observations || '',
      })
    } else {
      setEditId(null); setForm(EMPTY)
    }
    setShowModal(true)
  }

  const pucesEleves = eleves.map(e => ({ id: e.id, titre: `${e.prenom} ${e.nom}`, sous: e.telephone || 'Pas de numéro',
    badge: e.typeFormation === 'PERFECTIONNEMENT' ? 'Perfectionnement' : `Permis ${e.categoriePermis || ''}`, mots: [e.prenom, e.nom, e.telephone] }))
  const pucesMoniteurs = moniteurs.map(m => ({ id: m.id, titre: `${m.prenom} ${m.nom}`, sous: m.telephone, mots: [m.prenom, m.nom, m.telephone] }))
  const pucesVehicules = vehicules.map(v => ({ id: v.id, titre: `${v.marque} ${v.modele}`, sous: v.immatriculation,
    badge: v.categorie ? `Permis ${v.categorie}` : null, mots: [v.immatriculation, v.marque, v.modele] }))

  const save = async () => {
    const { date, heureDebut, heureFin, eleveId, eleveIds, moniteurId, type, vehiculeId } = form
    const ids = editId ? [eleveId].filter(Boolean) : eleveIds
    if (!date || !heureDebut || !heureFin || !ids.length || !moniteurId || !type) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    if (type === 'CONDUITE' && !vehiculeId) {
      toast('Un véhicule est obligatoire pour une leçon de conduite', 'warning'); return
    }
    const data = {
      date, heureDebut, heureFin,
      moniteurId: parseInt(moniteurId),
      vehiculeId: vehiculeId ? parseInt(vehiculeId) : null,
      type,
      observations: form.observations || null,
    }
    if (editId) {
      try { await api('PUT', `/lecons/${editId}`, { ...data, eleveId: parseInt(eleveId) }); toast('Leçon modifiée'); setShowModal(false); load() }
      catch (e) { toast(e.message, 'danger') }
      return
    }
    // Plusieurs élèves sur le même créneau : une leçon chacun (même moniteur, même véhicule)
    const refuses = [], messages = []
    let faites = 0
    for (const id of ids) {
      try { await api('POST', '/lecons', { ...data, eleveId: parseInt(id) }); faites++ }
      catch (e) {
        const el = eleves.find(x => String(x.id) === String(id))
        refuses.push(id); messages.push(`${el ? `${el.prenom} ${el.nom}` : 'Élève'} : ${e.message}`)
      }
    }
    if (faites) { toast(faites > 1 ? `${faites} leçons planifiées` : 'Leçon planifiée'); load() }
    // Élèves refusés (ex. perfectionnement en leçon de code) : restent cochés pour corriger
    if (refuses.length) { toast(messages.join(' · '), 'danger'); setForm(f => ({ ...f, eleveIds: refuses })) }
    else setShowModal(false)
  }

  const terminer = async (id) => {
    if (!(await confirmer({ titre: 'Marquer cette leçon comme terminée ?', ton: 'succes', libelle: 'Terminer' }))) return
    try { await api('PATCH', `/lecons/${id}/terminer`); toast('Leçon terminée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const annuler = async (id) => {
    if (!(await confirmer({ titre: 'Annuler cette leçon ?', ton: 'alerte', icone: 'x-circle-fill', libelle: 'Annuler la leçon', libelleRetour: 'Garder' }))) return
    try { await api('PATCH', `/lecons/${id}/annuler`); toast('Leçon annulée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer cette leçon ?', ton: 'danger', libelle: 'Supprimer', message: 'Cette action est définitive.' }))) return
    try { await api('DELETE', `/lecons/${id}`); toast('Leçon supprimée'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  // Recherche sur l'élève, le moniteur et l'immatriculation du véhicule
  const filtered = list.filter(l => (!site || l.eleve?.site === site)
    && correspond([l.eleve?.prenom, l.eleve?.nom, l.moniteur?.prenom, l.moniteur?.nom, l.vehicule?.immatriculation], search))

  const colSpan = isEleve ? 6 : 9

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête : comme « Mes élèves », Retour puis directement la recherche avec le bouton d'ajout */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
            Retour
          </button>
        </div>
      )}

      {/* L'élève ne voit que ses leçons : recherche seule, sans filtre bureau ni ajout */}
      <BarreFiltres>
        <Recherche value={search} onChange={setSearch} placeholder={isEleve ? 'Moniteur ou véhicule…' : 'Élève, moniteur ou véhicule…'} />
        {!isEleve && (
          <>
            <Filtre icone="building" value={site} onChange={setSite}>
              <option value="">Tous les bureaux</option>
              {BUREAUX.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Filtre>
            <BoutonAjout onClick={() => openModal()}>Leçon</BoutonAjout>
          </>
        )}
      </BarreFiltres>

      {/* ── Tableau : bandeau bleu nuit souligné d'or, comme « Véhicules » ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone={isEleve ? 'car-front-fill' : 'calendar2-check-fill'} titre="Cours Conduite"
          sousTitre={isEleve ? 'Formation pratique à la conduite' : 'Planning des leçons'} nombre={filtered.length} />

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full table-cards">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Date & Horaire', ...(!isEleve ? ['Élève', 'Bureau'] : []), 'Moniteur', 'Véhicule', 'Type', 'Statut', ...(!isEleve ? ['Actions'] : [])].map((h, i) => (
                  <th key={h + i}
                    className={`py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${i === 0 ? 'text-center w-10' : h === 'Actions' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan}><ListeChargement /></td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <ListeVide texte={search.trim() || site ? 'Aucune leçon trouvée' : 'Aucune leçon planifiée'} icone="calendar2-check" />
                  </td>
                </tr>
              ) : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((l, i) => {
                const editable   = l.statut === 'PLANIFIEE'
                const terminable = l.statut === 'PLANIFIEE' || l.statut === 'EN_COURS'
                const typeSt     = TYPE_STYLE[l.type]   || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: l.type }
                const statutSt   = STATUT_STYLE[l.statut] || { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: l.statut }
                const isEven     = i % 2 === 0
                return (
                  <tr key={l.id} style={{ background: isEven ? '#fff' : '#fafbfc' }}
                    className="transition-colors hover:bg-blue-50/40">
                    <td className="py-3.5 px-4 text-center cell-hide">
                      <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    </td>
                    {/* Côté élève la date fait office de titre ; côté admin c'est le nom de l'élève. */}
                    <td className={`py-3.5 px-4${isEleve ? ' cell-title' : ''}`} data-label="Date & Horaire">
                      <div className="text-sm font-semibold text-slate-700">{fmtDate(l.date)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {l.heureDebut ? `${l.heureDebut.slice(0,5)} – ${l.heureFin?.slice(0,5)}` : '—'}
                      </div>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4 text-sm text-slate-600 font-medium cell-title">
                        {l.eleve ? `${l.eleve.prenom} ${l.eleve.nom}` : '—'}
                      </td>
                    )}
                    {!isEleve && (
                      <td className="py-3.5 px-4" data-label="Bureau">
                        {l.eleve?.site ? <Badge value={l.eleve.site} map={BADGES.site} /> : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-sm text-slate-600" data-label="Moniteur">
                      {l.moniteur ? `${l.moniteur.prenom} ${l.moniteur.nom}` : '—'}
                    </td>
                    <td className="py-3.5 px-4" data-label="Véhicule">
                      {l.vehicule
                        ? <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">{l.vehicule.immatriculation}</span>
                        : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="py-3.5 px-4" data-label="Type">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: typeSt.bg, color: typeSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeSt.dot }} />
                        {typeSt.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" data-label="Statut">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: statutSt.bg, color: statutSt.color }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statutSt.dot }} />
                        {statutSt.label}
                      </span>
                    </td>
                    {!isEleve && (
                      <td className="py-3.5 px-4 cell-actions">
                        <div className="flex items-center justify-end gap-1">
                          {terminable && (
                            <button onClick={() => terminer(l.id)} title="Terminer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#dcfce7', color: '#15803d' }}>
                              <i className="bi bi-check-lg" style={{ fontSize: '.85rem' }} />
                            </button>
                          )}
                          {editable && (
                            <button onClick={() => annuler(l.id)} title="Annuler"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#fef9c3', color: '#a16207' }}>
                              <i className="bi bi-x-lg" style={{ fontSize: '.85rem' }} />
                            </button>
                          )}
                          {editable && (
                            <button onClick={() => openModal(l)} title="Modifier"
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                              style={{ background: '#f1f5f9', color: '#475569' }}>
                              <i className="bi bi-pencil-fill" style={{ fontSize: '.78rem' }} />
                            </button>
                          )}
                          <button onClick={() => del(l.id)} title="Supprimer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-all hover:opacity-80"
                            style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            <i className="bi bi-trash-fill" style={{ fontSize: '.78rem' }} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Modal planifier / modifier ───────────────────────── */}
      {showModal && (() => {
        const nbEleves = editId ? (form.eleveId ? 1 : 0) : form.eleveIds.length
        const duree = minutes(form.heureFin) - minutes(form.heureDebut)
        return (
          <FenetreModerne
            surTitre="Cours de conduite"
            titre={editId ? 'Modifier la leçon' : 'Planifier une leçon'}
            icone="car-front-fill"
            details={[
              form.date && ['calendar3', fmtDate(form.date)],
              form.heureDebut && form.heureFin && ['clock', `${form.heureDebut} – ${form.heureFin}`],
              nbEleves > 0 && ['people-fill', nbEleves > 1 ? `${nbEleves} élèves` : '1 élève'],
            ]}
            piedGauche={!editId && nbEleves > 1 ? `Une leçon par élève : ${nbEleves} leçons, même créneau` : undefined}
            libelleSave={editId ? 'Enregistrer' : nbEleves > 1 ? `Planifier ${nbEleves} leçons` : 'Planifier'}
            onClose={() => setShowModal(false)} onSave={save}>

            <Etape n={1} icon="people" titre={editId ? 'Élève' : 'Élèves · un ou plusieurs'}>
              {editId
                ? <ChoixPuces items={pucesEleves} placeholder="Nom, prénom ou téléphone…" valeur={form.eleveId} onChoisir={id => setForm(f => ({ ...f, eleveId: id }))} />
                : <ChoixPuces multiple items={pucesEleves} placeholder="Nom, prénom ou téléphone…" valeur={form.eleveIds} onChoisir={ids => setForm(f => ({ ...f, eleveIds: ids }))} />}
            </Etape>

            <Etape n={2} icon="person-badge" titre="Moniteur et véhicule">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Etiquette requis>Moniteur</Etiquette>
                  <ChoixPuces items={pucesMoniteurs} unite="moniteur" placeholder="Nom ou téléphone…" hauteur={180}
                    valeur={form.moniteurId} onChoisir={id => setForm(f => ({ ...f, moniteurId: id }))} />
                </div>
                <div>
                  <Etiquette requis={form.type === 'CONDUITE'}>Véhicule</Etiquette>
                  <ChoixPuces items={pucesVehicules} unite="véhicule" placeholder="Immatriculation ou modèle…" hauteur={180}
                    valeur={form.vehiculeId} onChoisir={id => setForm(f => ({ ...f, vehiculeId: id }))} />
                </div>
              </div>
            </Etape>

            <Etape n={3} icon="calendar-event" titre="Date et horaire">
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <Etiquette requis>Date</Etiquette>
                  <input type="date" className={champCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Etiquette requis>Heure début</Etiquette>
                  {/* Changer le début garde la durée choisie */}
                  <input type="time" className={champCls} value={form.heureDebut}
                    onChange={e => { const d = e.target.value; setForm(f => ({ ...f, heureDebut: d, heureFin: duree > 0 && d ? heure(minutes(d) + duree) : f.heureFin })) }} />
                </div>
                <div>
                  <Etiquette requis>Heure fin</Etiquette>
                  <input type="time" className={champCls} value={form.heureFin} onChange={e => setForm(f => ({ ...f, heureFin: e.target.value }))} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Durée :</span>
                <Choix value={duree} onChange={m => setForm(f => ({ ...f, heureFin: heure(minutes(f.heureDebut) + m) }))}
                  options={[[60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h']].map(([v, label]) => ({ v, label, icon: 'stopwatch', color: '#b45309', bg: '#fffbeb' }))} />
              </div>
            </Etape>

            <Etape n={4} icon="chat-left-text" titre="Observations">
              <textarea className={champCls} rows={2} value={form.observations} placeholder="Ex. Créneaux, manœuvres, parcours d'examen… (facultatif)"
                onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
            </Etape>
          </FenetreModerne>
        )
      })()}
    </div>
  )
}
