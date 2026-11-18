import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, fmtTime, correspond } from '../utils'
import { toast } from './Toast'
import PlanningSemaine from './PlanningSemaine'
import OuvertureReservations from './OuvertureReservations'
import { EnteteListe, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, BoutonAjout } from './ListeModerne'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import { FenetreModerne, Etape, Etiquette, Choix } from './FenetreModerne'
import { champCls } from './fenetreStyles'
import Pagination from './Pagination'
import ChoixPuces from './ChoixPuces'
import '../landing.css'
import { afficherTelephone } from '../telephones'
import { useBureaux } from '../bureaux'
import PastilleBureau from './PastilleBureau'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
// Page « Cours Conduite » : toute nouvelle leçon est une leçon de conduite (pas de champ Type)
// eleveIds : élèves cochés à la création (une leçon chacun) ; eleveId : l'élève d'une leçon modifiée
// plusieurs : même horaire répété sur des jours de la semaine (jours : 0 = lundi … 5 = samedi), pendant « semaines » semaines
const EMPTY = { date: today(), heureDebut: '08:00', heureFin: '10:00', type: 'CONDUITE', eleveId: '', eleveIds: [], moniteurId: '', vehiculeId: '', observations: '',
  plusieurs: false, jours: [], semaines: 1 }
const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const versDate = s => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j) }
const versIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/* Dates d'une planification sur plusieurs jours : les jours cochés, à partir de la date choisie
   (comprise), pendant le nombre de semaines voulu ; sans « plusieurs », la seule date choisie. */
function datesPlanifiees(f) {
  if (!f.date) return []
  if (!f.plusieurs) return [f.date]
  const debut = versDate(f.date)
  const lundi = new Date(debut); lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7))
  const dates = []
  for (let w = 0; w < (f.semaines || 1); w++)
    for (const j of [...f.jours].sort()) {
      const d = new Date(lundi); d.setDate(lundi.getDate() + w * 7 + j)
      if (d >= debut) dates.push(versIso(d))
    }
  return dates
}


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
const PLACES_CRENEAU = 3   // élèves d'un moniteur sur un même créneau (comme les réservations)
const minutes = h => { const [a, b] = (h || '0:0').split(':').map(Number); return a * 60 + b }
const heure = m => `${String(Math.floor(Math.min(m, 1439) / 60)).padStart(2, '0')}:${String(Math.min(m, 1439) % 60).padStart(2, '0')}`

export default function Lecons({ onBack }) {
  // Élèves admis à l'examen du code : indiqués dans le choix des élèves d'une leçon
  const [admisCode, setAdmisCode] = useState(() => new Set())
  useEffect(() => { api('GET', '/eleves/admis-code').then(ids => setAdmisCode(new Set(ids || []))).catch(() => {}) }, [])
  const bureaux = useBureaux()
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
  // Personnel : planning en liste, ou vue semaine (grille jours × heures par moniteur)
  const [vue, setVue] = useState(() => { try { return localStorage.getItem('lecons-vue') || 'liste' } catch { return 'liste' } })
  const changerVue = v => { setVue(v); try { localStorage.setItem('lecons-vue', v) } catch { /* stockage indisponible */ } }

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

  const openModal = async (l = null, preset = null) => {
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
      // Vue semaine : une place libre ouvre le formulaire à ce jour, cette heure et ce moniteur
      setEditId(null); setForm(preset ? { ...EMPTY, ...preset } : EMPTY)
    }
    setShowModal(true)
  }

  // Leçon de conduite : seulement les élèves en perfectionnement et ceux du permis admis au code
  // (l'élève d'une leçon déjà planifiée reste proposé)
  const conduitePossible = e => e.typeFormation === 'PERFECTIONNEMENT' || admisCode.has(e.id) || (editId && String(e.id) === String(form.eleveId))
  const pucesEleves = eleves.filter(e => form.type !== 'CONDUITE' || conduitePossible(e)).map(e => ({ id: e.id, titre: `${e.prenom} ${e.nom}`, sous: e.telephone ? afficherTelephone(e.telephone) : 'Pas de numéro',
    // Permis : l'indice « code admis » dit si l'élève peut déjà faire la conduite
    badge: e.typeFormation === 'PERFECTIONNEMENT' ? 'Perfectionnement' : `Permis ${e.categoriePermis || ''} · ${admisCode.has(e.id) ? 'code admis ✓' : 'code à passer'}`, mots: [e.prenom, e.nom, e.telephone] }))
  const pucesMoniteurs = moniteurs.map(m => ({ id: m.id, titre: `${m.prenom} ${m.nom}`, sous: m.telephone, mots: [m.prenom, m.nom, m.telephone] }))
  const pucesVehicules = vehicules.map(v => ({ id: v.id, titre: `${v.marque} ${v.modele}`, sous: v.immatriculation,
    badge: v.categorie ? `Permis ${v.categorie}` : null, mots: [v.immatriculation, v.marque, v.modele] }))

  /* Conflits du créneau choisi avec les leçons déjà planifiées (annulées exclues) : moniteur pris
     sur un autre horaire qui chevauche, créneau au-delà de 3 élèves, véhicule avec un autre
     moniteur, élève déjà en leçon. Une alerte, pas un blocage : on peut planifier quand même. */
  const conflitsDuJour = date => {
    const { heureDebut, heureFin, moniteurId, vehiculeId } = form
    if (!date || !heureDebut || !heureFin || minutes(heureFin) <= minutes(heureDebut)) return []
    const d = minutes(heureDebut), f = minutes(heureFin)
    const hh = l => `${l.heureDebut?.slice(0, 5)}–${l.heureFin?.slice(0, 5)}`
    const nomM = m => m ? `${m.prenom} ${m.nom}` : 'le moniteur'
    const nomV = v => v ? `${v.marque} ${v.modele} (${v.immatriculation})` : 'un autre véhicule'
    const autres = list.filter(l => l.id !== editId && l.statut !== 'ANNULEE' && l.date === date
      && minutes(l.heureDebut?.slice(0, 5)) < f && d < minutes(l.heureFin?.slice(0, 5)))
    const memeCreneau = l => l.heureDebut?.slice(0, 5) === heureDebut && l.heureFin?.slice(0, 5) === heureFin
    const alertes = []
    if (moniteurId) {
      const m = autres.filter(l => String(l.moniteur?.id) === String(moniteurId))
      const moniteur = m[0]?.moniteur || moniteurs.find(x => String(x.id) === String(moniteurId))
      const decalees = m.filter(l => !memeCreneau(l))
      if (decalees.length) alertes.push({ icone: 'person-badge', texte: `Moniteur déjà pris : ${nomM(moniteur)} a déjà ${decalees.length > 1 ? `${decalees.length} leçons` : 'une leçon'} à ${[...new Set(decalees.map(hh))].join(', ')}.` })
      const groupe = m.filter(memeCreneau)
      const total = groupe.length + (editId ? 1 : Math.max(1, form.eleveIds.length))
      if (total > PLACES_CRENEAU) alertes.push({ icone: 'people-fill', texte: `Créneau complet : ${nomM(moniteur)} aurait ${total} élèves de ${heureDebut} à ${heureFin} (${PLACES_CRENEAU} au plus ; ${groupe.length} déjà planifié${groupe.length > 1 ? 's' : ''}).` })
      const autreVehicule = vehiculeId && groupe.find(l => l.vehicule && String(l.vehicule.id) !== String(vehiculeId))
      if (autreVehicule) alertes.push({ icone: 'car-front', texte: `Sur ce créneau, ${nomM(moniteur)} conduit déjà avec ${nomV(autreVehicule.vehicule)}.` })
    }
    if (vehiculeId) {
      const v = autres.filter(l => String(l.vehicule?.id) === String(vehiculeId) && String(l.moniteur?.id) !== String(moniteurId))
      if (v.length) alertes.push({ icone: 'car-front-fill', texte: `Véhicule déjà pris : ${nomV(v[0].vehicule)} est avec ${[...new Set(v.map(l => `${nomM(l.moniteur)} (${hh(l)})`))].join(', ')}.` })
    }
    const ids = (editId ? [form.eleveId] : form.eleveIds).filter(Boolean).map(String)
    const occupes = autres.filter(l => ids.includes(String(l.eleve?.id)))
    if (occupes.length) alertes.push({ icone: 'person-exclamation', texte: `Élève déjà en leçon à cette heure : ${occupes.map(l => `${l.eleve.prenom} ${l.eleve.nom} (${hh(l)}, ${nomM(l.moniteur)})`).join(', ')}.` })
    return alertes
  }
  // Toutes les dates planifiées : chaque alerte précédée de sa date quand il y en a plusieurs
  const conflits = () => {
    const dates = editId ? [form.date] : datesPlanifiees(form)
    return dates.flatMap(d => conflitsDuJour(d).map(a => dates.length > 1 ? { ...a, texte: `${fmtDate(d)} · ${a.texte}` } : a))
  }
  // Conflit signalé : un second clic sur Planifier confirme ; tout changement du formulaire réarme l'alerte
  const [forcer, setForcer] = useState(false)
  const formulaire = JSON.stringify(form)
  const [dernierFormulaire, setDernierFormulaire] = useState(formulaire)
  if (dernierFormulaire !== formulaire) { setDernierFormulaire(formulaire); setForcer(false) }

  const save = async () => {
    const { date, heureDebut, heureFin, eleveId, eleveIds, moniteurId, type, vehiculeId } = form
    const ids = editId ? [eleveId].filter(Boolean) : eleveIds
    const dates = editId ? [date] : datesPlanifiees(form)
    if (!editId && form.plusieurs && !dates.length) {
      toast('Cochez au moins un jour (à partir de la date choisie)', 'warning'); return
    }
    if (!date || !heureDebut || !heureFin || !ids.length || !moniteurId || !type) {
      toast('Veuillez remplir tous les champs obligatoires', 'warning'); return
    }
    if (type === 'CONDUITE' && !vehiculeId) {
      toast('Un véhicule est obligatoire pour une leçon de conduite', 'warning'); return
    }
    if (conflits().length && !forcer) {
      setForcer(true)
      toast('Conflit sur ce créneau : vérifiez les alertes, puis cliquez à nouveau pour planifier quand même', 'warning'); return
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
    // Plusieurs élèves sur le même créneau : une leçon chacun (même moniteur, même véhicule),
    // et sur plusieurs jours : une leçon par jour
    const refuses = [], messages = []
    let faites = 0
    for (const d of dates) {
      for (const id of ids) {
        try { await api('POST', '/lecons', { ...data, date: d, eleveId: parseInt(id) }); faites++ }
        catch (e) {
          const el = eleves.find(x => String(x.id) === String(id))
          if (!refuses.includes(id)) refuses.push(id)
          messages.push(`${dates.length > 1 ? `${fmtDate(d)} · ` : ''}${el ? `${el.prenom} ${el.nom}` : 'Élève'} : ${e.message}`)
        }
      }
    }
    if (faites) { toast(faites > 1 ? `${faites} leçons planifiées` : 'Leçon planifiée'); load() }
    // Élèves refusés (ex. perfectionnement en leçon de code) : restent cochés pour corriger
    if (refuses.length) {
      toast(messages.slice(0, 4).join(' · ') + (messages.length > 4 ? ` · et ${messages.length - 4} autre(s)` : ''), 'danger')
      // Sur un seul jour, les élèves refusés restent cochés pour corriger ; sur plusieurs, la fenêtre se ferme (les autres leçons sont faites)
      if (dates.length > 1 && faites) setShowModal(false); else setForm(f => ({ ...f, eleveIds: refuses }))
    }
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
              {bureaux.tous.map(b => <option key={b.code} value={b.code}>{b.nom}</option>)}
            </Filtre>
            <BoutonAjout onClick={() => openModal()}>Leçon</BoutonAjout>
          </>
        )}
      </BarreFiltres>

      {/* Personnel : ouverture des semaines aux réservations des élèves (bouton : administration, secrétariat) */}
      {!isEleve && <OuvertureReservations peutOuvrir={['SUPER_ADMIN', 'ADMIN', 'SECRETAIRE'].includes(user?.role)} />}

      {/* Personnel : liste ou semaine */}
      {!isEleve && (
        <div className="flex gap-1 p-1 w-full sm:w-auto sm:inline-flex" style={{ background: '#eef2f7', borderRadius: 999 }}>
          {[['liste', 'list-ul', 'Liste'], ['semaine', 'calendar-week', 'Semaine']].map(([v, icone, nom]) => (
            <button key={v} type="button" onClick={() => changerVue(v)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-extrabold border-0 cursor-pointer"
              style={{ borderRadius: 999, ...(vue === v ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>
              <i className={`bi bi-${icone}`} />{nom}
            </button>
          ))}
        </div>
      )}

      {!isEleve && vue === 'semaine' && (
        <PlanningSemaine lecons={list.filter(l => !site || l.eleve?.site === site)}
          moniteurTelephone={user?.role === 'MONITEUR' ? user?.email : null}
          onPlanifier={preset => openModal(null, preset)} onLecon={l => openModal(l)} />
      )}

      {/* ── Tableau : bandeau bleu nuit souligné d'or, comme « Véhicules » ── */}
      {(isEleve || vue === 'liste') && <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
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
                        {l.eleve?.site ? <PastilleBureau code={l.eleve.site} /> : <span className="text-slate-300">—</span>}
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
      </div>}

      {/* ── Modal planifier / modifier ───────────────────────── */}
      {showModal && (() => {
        const nbEleves = editId ? (form.eleveId ? 1 : 0) : form.eleveIds.length
        const dates = editId ? [form.date] : datesPlanifiees(form)
        const nbLecons = nbEleves * dates.length
        const duree = minutes(form.heureFin) - minutes(form.heureDebut)
        const alertes = conflits()
        return (
          <FenetreModerne
            surTitre="Cours de conduite"
            titre={editId ? 'Modifier la leçon' : 'Planifier une leçon'}
            icone="car-front-fill"
            details={[
              form.date && ['calendar3', !editId && form.plusieurs ? `${dates.length} jour${dates.length > 1 ? 's' : ''} dès le ${fmtDate(form.date)}` : fmtDate(form.date)],
              form.heureDebut && form.heureFin && ['clock', `${form.heureDebut} – ${form.heureFin}`],
              nbEleves > 0 && ['people-fill', nbEleves > 1 ? `${nbEleves} élèves` : '1 élève'],
            ]}
            piedGauche={alertes.length
              ? <span className="font-bold" style={{ color: '#c2410c' }}><i className="bi bi-exclamation-triangle-fill me-1" />{alertes.length > 1 ? `${alertes.length} conflits` : '1 conflit'} sur ce créneau (voir sous l'horaire)</span>
              : !editId && nbLecons > 1 ? (dates.length > 1 ? `Une leçon par élève et par jour : ${nbLecons} leçons` : `Une leçon par élève : ${nbLecons} leçons, même créneau`) : undefined}
            libelleSave={alertes.length && forcer ? (editId ? 'Enregistrer quand même' : 'Planifier quand même') : editId ? 'Enregistrer' : nbLecons > 1 ? `Planifier ${nbLecons} leçons` : 'Planifier'}
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
                  <Etiquette requis>{!editId && form.plusieurs ? 'À partir du' : 'Date'}</Etiquette>
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
              {/* Création : le même horaire sur plusieurs jours (jours de la semaine, pendant 1 à 8 semaines) */}
              {!editId && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px dashed #e2e8f0' }}>
                  <label className="flex items-center gap-2 text-sm font-bold cursor-pointer" style={{ color: '#1e3a5f' }}>
                    <input type="checkbox" className="form-check-input m-0 flex-shrink-0" style={{ marginRight: 4 }} checked={form.plusieurs}
                      onChange={e => {
                        const on = e.target.checked
                        // Coché : le jour de la date choisie l'est d'office (s'il est du lundi au samedi)
                        const j = form.date ? (versDate(form.date).getDay() + 6) % 7 : null
                        setForm(f => ({ ...f, plusieurs: on, jours: on && !f.jours.length && j !== null && j < 6 ? [j] : f.jours }))
                      }} />
                    <i className="bi bi-calendar-range" />Planifier sur plusieurs jours
                  </label>
                  {form.plusieurs && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-slate-500 mb-1.5">Jours (à partir du {form.date ? fmtDate(form.date) : '…'})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {JOURS_COURTS.map((nom, k) => {
                            const on = form.jours.includes(k)
                            return (
                              <button key={k} type="button" onClick={() => setForm(f => ({ ...f, jours: on ? f.jours.filter(x => x !== k) : [...f.jours, k] }))}
                                className="px-3 py-1.5 text-sm font-bold cursor-pointer"
                                style={{ borderRadius: 999, border: `1.5px solid ${on ? '#1e3a5f' : '#e2e8f0'}`, background: on ? '#1e3a5f' : '#fff', color: on ? '#fff' : '#475569' }}>
                                {nom}
                              </button>
                            )
                          })}
                          <button type="button" onClick={() => setForm(f => ({ ...f, jours: f.jours.length === 6 ? [] : [0, 1, 2, 3, 4, 5] }))}
                            className="px-3 py-1.5 text-xs font-bold cursor-pointer" style={{ borderRadius: 999, border: '1.5px dashed #cbd5e1', background: 'transparent', color: '#64748b' }}>
                            {form.jours.length === 6 ? 'Aucun' : 'Lun → Sam'}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Pendant :</span>
                        <Choix value={form.semaines} onChange={n => setForm(f => ({ ...f, semaines: n }))}
                          options={[1, 2, 3, 4, 6, 8].map(v => ({ v, label: `${v} semaine${v > 1 ? 's' : ''}`, icon: 'calendar-week', color: '#1d4ed8', bg: '#eff6ff' }))} />
                      </div>
                      {/* Aperçu des dates */}
                      {(() => {
                        const ds = datesPlanifiees(form)
                        return ds.length === 0
                          ? <div className="text-xs text-slate-400">Cochez au moins un jour.</div>
                          : (
                            <div>
                              <div className="text-xs font-bold text-slate-500 mb-1">{ds.length} date{ds.length > 1 ? 's' : ''}{nbEleves ? ` · ${ds.length * nbEleves} leçon${ds.length * nbEleves > 1 ? 's' : ''}` : ''}</div>
                              <div className="flex flex-wrap gap-1">
                                {ds.map(d => (
                                  <span key={d} className="text-[11px] font-semibold px-2 py-0.5" style={{ borderRadius: 999, background: '#f1f5f9', color: '#334155' }}>
                                    {versDate(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </Etape>

            {/* Alertes de conflit, sous l'horaire : mises à jour à chaque changement */}
            {alertes.length > 0 && (
              <div className="rounded-2xl px-4 py-3" role="alert" style={{ background: '#fff7ed', border: '1.5px solid #fdba74' }}>
                <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: '#c2410c' }}>
                  <i className="bi bi-exclamation-triangle-fill" />Attention : créneau déjà occupé
                </div>
                <ul className="mt-1.5 mb-0 ps-0 list-none space-y-1">
                  {alertes.map((a, i) => (
                    <li key={i} className="flex gap-2 text-[13px]" style={{ color: '#9a3412' }}>
                      <i className={`bi bi-${a.icone} flex-shrink-0 mt-0.5`} /><span>{a.texte}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] mt-1.5" style={{ color: '#b45309' }}>Changez l'heure, le moniteur ou le véhicule, ou planifiez quand même.</div>
              </div>
            )}

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
