import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDate, waLink, correspond } from '../utils'
import { msgRappelExamen, joursAvant } from '../messages'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { useAuth } from '../context/AuthContext'
import Pagination from './Pagination'
import { FenetreModerne, Etape, Etiquette, Choix, ChampMontant } from './FenetreModerne'
import { EnteteListe, LigneListe, AvatarRond, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Recherche, Filtre, FiltreDate, Reinitialiser, BoutonAjout } from './ListeModerne'
import { champCls } from './fenetreStyles'
import '../landing.css'

const PAGE_SIZE = 10

const today = () => new Date().toISOString().split('T')[0]
const EMPTY     = { date: today(), eleveIds: [], type: '', resultat: 'EN_ATTENTE', score: '', observations: '' }
const RES_EMPTY = { resultat: 'EN_ATTENTE', score: '', observations: '' }

const RES_STYLE = {
  ADMIS:      { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Admis' },
  REFUSE:     { bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626', label: 'Refusé' },
  EN_ATTENTE: { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04', label: 'En attente' },
}

const TYPE_STYLE = {
  CODE:     { bg: '#eff6ff', color: '#2563eb', dot: '#2563eb', label: 'Code' },
  CONDUITE: { bg: '#f0fdf4', color: '#15803d', dot: '#16a34a', label: 'Conduite' },
}


export default function Examens({ onEleveClick, onBack }) {
  const { user } = useAuth()
  const isEleve = user?.role === 'ELEVE'

  const [list, setList]                     = useState([])
  const [search, setSearch]                 = useState('')
  const [filterType, setFilterType]         = useState('')
  const [filterResultat, setFilterResultat] = useState('')
  const [filterTentative, setFilterTentative] = useState('')
  const [page, setPage]                     = useState(1)
  const [filterDateDe, setFilterDateDe]     = useState('')
  const [filterDateA, setFilterDateA]       = useState('')
  const [form, setForm]                     = useState(EMPTY)
  const [resForm, setResForm]               = useState(RES_EMPTY)
  const [resId, setResId]                   = useState(null)
  const [showModal, setShowModal]           = useState(false)
  const [showResModal, setShowResModal]     = useState(false)
  const [loading, setLoading]               = useState(true)
  const [eleves, setEleves]                 = useState([])
  const [rechercheEleve, setRechercheEleve] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = isEleve
        ? await api('GET', '/eleve/mes-examens')
        : await api('GET', '/examens')
      setList(data)
    } catch { toast('Erreur chargement examens', 'danger') }
    finally { setLoading(false) }
  }

  const [ecole, setEcole] = useState('')

  useEffect(() => {
    load()
    if (!isEleve) api('GET', '/config').then(c => setEcole(c.nom || '')).catch(() => {})
  }, [])

  /* Lien de rappel WhatsApp : seulement pour un examen à venir, sans résultat, avec un numéro exploitable. */
  const lienRappel = (e) =>
    e.resultat === 'EN_ATTENTE' && joursAvant(e.date) >= 0 && e.eleve
      ? waLink(e.eleve.telephone, msgRappelExamen(e, ecole))
      : null

  const aRappeler = list
    .filter(e => e.resultat === 'EN_ATTENTE' && joursAvant(e.date) >= 0 && joursAvant(e.date) <= 7)
    .sort((a, b) => a.date.localeCompare(b.date))

  const openModal = async () => {
    const ev = await api('GET', '/eleves')
    // Perfectionnement : conduite seule, pas d'examen du permis (refusé aussi par le serveur)
    setEleves(ev.filter(e => e.typeFormation !== 'PERFECTIONNEMENT')); setForm(EMPTY); setRechercheEleve(''); setShowModal(true)
  }

  /* Un examen par élève coché, avec la même date et la même épreuve. Les élèves refusés par le
     serveur restent cochés pour pouvoir corriger et réessayer. */
  const save = async () => {
    const { date, eleveIds, type } = form
    if (!date || !eleveIds.length || !type) { toast('Choisissez au moins un élève, la date et le type', 'warning'); return }
    if (enregistrement) return
    setEnregistrement(true)
    const refus = []
    for (const eleveId of eleveIds) {
      try {
        await api('POST', '/examens', {
          date, eleveId, type,
          resultat: form.resultat,
          score: form.score ? parseInt(form.score) : null,
          observations: form.observations || null,
        })
      } catch (e) {
        const el = eleves.find(x => x.id === eleveId)
        refus.push({ eleveId, texte: `${el ? `${el.prenom} ${el.nom}` : 'Élève'} : ${e.message}` })
      }
    }
    setEnregistrement(false)
    const ok = eleveIds.length - refus.length
    if (ok) toast(ok > 1 ? `${ok} examens enregistrés` : 'Examen enregistré')
    if (refus.length) {
      toast(refus.map(r => r.texte).join(' · '), 'danger')
      setForm(f => ({ ...f, eleveIds: refus.map(r => r.eleveId) }))
    } else setShowModal(false)
    if (ok) load()
  }

  const openResultat = (e) => {
    setResId(e.id)
    setResForm({ resultat: e.resultat || 'EN_ATTENTE', score: e.score ?? '', observations: e.observations || '' })
    setShowResModal(true)
  }

  const saveResultat = async () => {
    const body = {
      resultat: resForm.resultat,
      score: resForm.score ? parseInt(resForm.score) : null,
      observations: resForm.observations || null,
    }
    try {
      await api('PATCH', `/examens/${resId}/resultat`, body); toast('Résultat mis à jour')
      setShowResModal(false); load()
    } catch (e) { toast(e.message, 'danger') }
  }

  const del = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer cet examen ?', ton: 'danger', libelle: 'Supprimer', message: 'Cette action est définitive.' }))) return
    try { await api('DELETE', `/examens/${id}`); toast('Examen supprimé'); load() }
    catch (e) { toast(e.message, 'danger') }
  }

  useEffect(() => { setPage(1) }, [search, filterType, filterResultat, filterTentative, filterDateDe, filterDateA])

  const tentatives = [...new Set(list.map(e => e.tentative))].sort((a, b) => a - b)

  const filtered = list
    .filter(e => correspond([e.eleve?.prenom, e.eleve?.nom], search))
    .filter(e => !filterType      || e.type      === filterType)
    .filter(e => !filterResultat  || e.resultat  === filterResultat)
    .filter(e => !filterTentative || e.tentative === parseInt(filterTentative))
    .filter(e => !filterDateDe    || e.date >= filterDateDe)
    .filter(e => !filterDateA     || e.date <= filterDateA)


  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Bouton retour (élève) ────────────────────────────── */}
      {isEleve && onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-retour">
            <span className="btn-retour-icone"><i className="bi bi-arrow-left" /></span>
            Retour
          </button>
        </div>
      )}

      {/* ── En-tête (élève) : filtres sur ses propres examens (pas de recherche par nom, pas d'ajout) ── */}
      {isEleve && (
        <BarreFiltres>
          <Filtre icone="journal-text" value={filterType} onChange={setFilterType}>
            <option value="">Tous les types</option>
            <option value="CODE">Code</option>
            <option value="CONDUITE">Conduite</option>
          </Filtre>
          <Filtre icone="trophy" value={filterResultat} onChange={setFilterResultat}>
            <option value="">Tous les résultats</option>
            <option value="ADMIS">Admis</option>
            <option value="REFUSE">Refusé</option>
            <option value="EN_ATTENTE">En attente</option>
          </Filtre>
          {(filterType || filterResultat) && <Reinitialiser onClick={() => { setFilterType(''); setFilterResultat('') }} />}
        </BarreFiltres>
      )}

      {/* ── En-tête (admin) : filtres et bouton d'ajout, même disposition que les autres pages ── */}
      {!isEleve && (
        <BarreFiltres>
          <Recherche value={search} onChange={setSearch} placeholder="Rechercher par nom ou prénom…" />
          <Filtre icone="journal-text" value={filterType} onChange={setFilterType}>
            <option value="">Tous les types</option>
            <option value="CODE">Code</option>
            <option value="CONDUITE">Conduite</option>
          </Filtre>
          <Filtre icone="trophy" value={filterResultat} onChange={setFilterResultat}>
            <option value="">Tous les résultats</option>
            <option value="ADMIS">Admis</option>
            <option value="REFUSE">Refusé</option>
            <option value="EN_ATTENTE">En attente</option>
          </Filtre>
          <Filtre icone="arrow-repeat" value={filterTentative} onChange={setFilterTentative}>
            <option value="">Toutes les tentatives</option>
            {tentatives.map(t => <option key={t} value={t}>{t}{t === 1 ? 're' : 'e'} tentative</option>)}
          </Filtre>
          {/* Du et Au restent ensemble (côte à côte) quelle que soit la largeur de l'écran */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <FiltreDate libelle="Du" value={filterDateDe} onChange={setFilterDateDe} />
            <FiltreDate libelle="Au" value={filterDateA} onChange={setFilterDateA} />
          </div>
          {(search || filterType || filterResultat || filterTentative || filterDateDe || filterDateA) && (
            <Reinitialiser onClick={() => { setSearch(''); setFilterType(''); setFilterResultat(''); setFilterTentative(''); setFilterDateDe(''); setFilterDateA('') }} />
          )}
          {/* Calé à droite comme les boutons de la page Élèves (pleine largeur sur téléphone) */}
          <div className="grid grid-cols-1 sm:flex w-full sm:w-auto sm:ms-auto">
            <BoutonAjout onClick={openModal}>Examen</BoutonAjout>
          </div>
        </BarreFiltres>
      )}

      {/* ── Rappels à envoyer : examens des 7 prochains jours (admin) ── */}
      {!isEleve && aRappeler.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.07)' }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <i className="bi bi-whatsapp" style={{ color: '#16a34a', fontSize: '.95rem' }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800">Rappels à envoyer</div>
              <div className="text-xs text-slate-400">Examens des 7 prochains jours</div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
              {aRappeler.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {aRappeler.map(e => {
              const lien = lienRappel(e)
              const j = joursAvant(e.date)
              return (
                <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{e.eleve?.prenom} {e.eleve?.nom}</div>
                    <div className="text-xs text-slate-400">
                      {(TYPE_STYLE[e.type]?.label) || e.type} · {fmtDate(e.date)}
                      <span className="font-semibold" style={{ color: j <= 1 ? '#dc2626' : '#a16207' }}>
                        {' '}· {j === 0 ? "aujourd'hui" : j === 1 ? 'demain' : `dans ${j} jours`}
                      </span>
                    </div>
                  </div>
                  {lien ? (
                    <a href={lien} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold no-underline flex-shrink-0"
                      style={{ background: '#25d366', color: '#fff' }}>
                      <i className="bi bi-whatsapp" />Rappeler
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 flex-shrink-0">Pas de numéro</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* ── Liste des examens ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }}>
        <EnteteListe icone="clipboard2-check-fill" titre={isEleve ? 'Mes examens' : 'Examens'}
          sousTitre={isEleve ? 'Historique de vos passages' : 'Résultats et suivi des passages'} nombre={filtered.length} />
        {loading ? <ListeChargement />
          : filtered.length === 0 ? <ListeVide texte="Aucun examen trouvé" icone="clipboard2-check" />
          : filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map(e => {
            const resSt  = RES_STYLE[e.resultat] || { bg: '#f1f5f9', color: '#64748b', label: e.resultat }
            const typeSt = TYPE_STYLE[e.type]    || { bg: '#f1f5f9', color: '#64748b', label: e.type }
            const j = e.date ? joursAvant(e.date) : null
            const quand = j == null ? '' : j === 0 ? "Aujourd'hui" : j === 1 ? 'Demain' : j > 1 ? `Dans ${j} jours` : j === -1 ? 'Hier' : `Il y a ${-j} jours`
            const rappel = !isEleve && lienRappel(e)
            return (
              <LigneListe key={e.id}>
                {/* Élève (ou, côté élève, l'épreuve) */}
                <div className="flex items-center gap-3 min-w-0">
                  {isEleve ? (
                    <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ borderRadius: '999px', background: typeSt.bg, color: typeSt.color }}>
                      <i className={`bi bi-${e.type === 'CODE' ? 'signpost-2-fill' : 'car-front-fill'}`} />
                    </div>
                  ) : <AvatarRond photoUrl={e.eleve?.photoUrl} prenom={e.eleve?.prenom} nom={e.eleve?.nom} />}
                  <div className="min-w-0">
                    {isEleve ? (
                      <div className="font-bold text-[#1e3a5f]">Examen de {typeSt.label.toLowerCase()}</div>
                    ) : e.eleve && onEleveClick ? (
                      <button onClick={() => onEleveClick(e.eleve.id)}
                        className="block text-left font-bold text-[#1e3a5f] hover:underline bg-transparent border-0 p-0 cursor-pointer truncate max-w-full">
                        {e.eleve.nom} {e.eleve.prenom}
                      </button>
                    ) : <div className="font-bold text-slate-700 truncate">{e.eleve ? `${e.eleve.nom} ${e.eleve.prenom}` : '—'}</div>}
                    <div className="text-xs text-slate-500">
                      {e.eleve?.categoriePermis && <span className="me-2"><i className="bi bi-award me-1" />Permis {e.eleve.categoriePermis}</span>}
                      <span><i className="bi bi-arrow-repeat me-1" />{e.tentative > 1 ? `${e.tentative}e tentative` : '1re tentative'}</span>
                    </div>
                  </div>
                </div>

                {/* Épreuve et date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 flex flex-col items-center justify-center flex-shrink-0"
                    style={{ borderRadius: '.8rem', background: typeSt.bg, color: typeSt.color }}>
                    <i className={`bi bi-${e.type === 'CODE' ? 'signpost-2-fill' : 'car-front-fill'}`} />
                    <span className="text-[9px] font-extrabold uppercase leading-none mt-0.5">{typeSt.label}</span>
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-slate-700">{fmtDate(e.date)}</div>
                    <div className="font-semibold" style={{ color: j != null && j >= 0 && e.resultat === 'EN_ATTENTE' ? '#b45309' : '#94a3b8' }}>{quand}</div>
                  </div>
                </div>

                {/* Score */}
                <div className="min-w-0 text-xs">
                  {e.score != null ? (
                    <>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-slate-500">Score</span>
                        <span><b className="text-sm text-slate-800">{e.score}</b><span className="text-slate-400">/100</span></span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden mt-1.5" style={{ background: '#eef2f7' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, e.score)}%`, background: resSt.color }} />
                      </div>
                    </>
                  ) : <span className="text-slate-400">Pas encore de score</span>}
                  {e.observations && <div className="text-slate-400 mt-1 truncate" title={e.observations}>{e.observations}</div>}
                </div>

                {/* Résultat et actions */}
                <div className="flex items-center justify-between md:justify-end gap-2">
                  <Pastille couleur={resSt.color} fond={resSt.bg}>{resSt.label}</Pastille>
                  {!isEleve && (
                    <div className="flex items-center gap-1.5">
                      {rappel && (
                        <a href={rappel} target="_blank" rel="noopener noreferrer" title="Rappel WhatsApp"
                          className="w-8 h-8 flex items-center justify-center no-underline transition-transform hover:scale-110"
                          style={{ borderRadius: '999px', background: '#dcfce7', color: '#16a34a' }}>
                          <i className="bi bi-whatsapp" style={{ fontSize: '.85rem' }} />
                        </a>
                      )}
                      <BoutonRond title="Saisir le résultat" icon="pencil-square" couleur="#2563eb" fond="#eff6ff" onClick={() => openResultat(e)} />
                      <BoutonRond title="Supprimer" icon="trash-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => del(e.id)} />
                    </div>
                  )}
                </div>
              </LigneListe>
            )
          })}
        <Pagination page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {/* ── Fenêtre nouvel examen ────────────────────────────── */}
      {showModal && (() => {
        const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
        const coches = eleves.filter(e => form.eleveIds.includes(e.id))
        const eleve = coches.length === 1 ? coches[0] : null
        const visibles = eleves.filter(e => correspond([e.prenom, e.nom, e.telephone], rechercheEleve))
        const basculer = id => set('eleveIds', form.eleveIds.includes(id) ? form.eleveIds.filter(x => x !== id) : [...form.eleveIds, id])
        const toutCocher = coche => {
          const ids = new Set(form.eleveIds)
          visibles.forEach(e => coche ? ids.add(e.id) : ids.delete(e.id))
          set('eleveIds', [...ids])
        }
        return (
          <FenetreModerne
            titre={eleve ? `${eleve.prenom} ${eleve.nom}` : coches.length ? `${coches.length} candidats` : 'Nouvel examen'}
            icone="clipboard2-check-fill"
            details={[
              form.type && ['journal-text', TYPE_STYLE[form.type].label],
              form.date && ['calendar-event', fmtDate(form.date)],
              eleve?.categoriePermis && ['award', `Permis ${eleve.categoriePermis}`],
            ]}
            onClose={() => setShowModal(false)} onSave={save}
            libelleSave={enregistrement ? 'Enregistrement…' : coches.length > 1 ? `Enregistrer les ${coches.length} examens` : "Enregistrer l'examen"}>
            <Etape n={1} icon="people" titre="Candidats">
              <div className="mb-3" style={{ maxWidth: 260 }}>
                <Etiquette requis>Date de l'examen</Etiquette>
                <input type="date" className={champCls} value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <Etiquette requis>Élèves · {form.eleveIds.length} coché{form.eleveIds.length > 1 ? 's' : ''} sur {eleves.length}</Etiquette>
              <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
                <div className="p-2 flex flex-wrap gap-2 items-center" style={{ borderBottom: '1px solid #eef2f7', background: '#f8fafc' }}>
                  <div className="flex flex-1" style={{ minWidth: 180 }}>
                    <Recherche value={rechercheEleve} onChange={setRechercheEleve} placeholder="Prénom, nom ou téléphone…" />
                  </div>
                  <button type="button" onClick={() => toutCocher(true)} className="filtre filtre-bouton" style={{ minHeight: 34, fontSize: '.8rem' }}>
                    <i className="bi bi-check2-all" />Tous
                  </button>
                  <button type="button" onClick={() => toutCocher(false)} className="filtre filtre-bouton" style={{ minHeight: 34, fontSize: '.8rem' }}>
                    <i className="bi bi-x-lg" />Aucun
                  </button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {eleves.length === 0 ? <ListeVide texte="Aucun élève enregistré" icone="people" />
                    : visibles.length === 0 ? <ListeVide texte="Aucun élève trouvé" icone="search" />
                    : visibles.map(e => {
                      const coche = form.eleveIds.includes(e.id)
                      return (
                        <div key={e.id} role="checkbox" aria-checked={coche} aria-label={`${e.prenom} ${e.nom}`} tabIndex={0}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
                          style={{ background: coche ? '#fffbeb' : '#fff', borderBottom: '1px solid #f1f5f9' }}
                          onClick={() => basculer(e.id)}
                          onKeyDown={ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); basculer(e.id) } }}>
                          <AvatarRond photoUrl={e.photoUrl} prenom={e.prenom} nom={e.nom} taille={32} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate" style={{ color: '#1e3a5f' }}>{e.prenom} {e.nom}</div>
                            {(e.telephone || e.categoriePermis) && <div className="text-xs text-slate-400 truncate">
                              {[e.telephone, e.categoriePermis && `Permis ${e.categoriePermis}`].filter(Boolean).join(' · ')}</div>}
                          </div>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ border: `2px solid ${coche ? '#d4a017' : '#cbd5e1'}`, background: coche ? 'linear-gradient(135deg,#d4a017,#f0bb2a)' : '#fff' }}>
                            {coche && <i className="bi bi-check-lg" style={{ color: '#1e3a5f', fontSize: '.75rem' }} />}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </Etape>

            <Etape n={2} icon="journal-check" titre="Épreuve">
              <Etiquette requis>Type</Etiquette>
              <div className="mb-4">
                <Choix tuiles cols={2} value={form.type} onChange={v => set('type', v)} options={[
                  { v: 'CODE',     label: 'Code',     icon: 'signpost-2-fill', sous: 'Code de la route', color: TYPE_STYLE.CODE.color, bg: TYPE_STYLE.CODE.bg },
                  { v: 'CONDUITE', label: 'Conduite', icon: 'car-front-fill',  sous: 'Épreuve pratique', color: TYPE_STYLE.CONDUITE.color, bg: TYPE_STYLE.CONDUITE.bg },
                ]} />
              </div>
              <Etiquette>Résultat</Etiquette>
              <div className="mb-4">
                <Choix cols={3} value={form.resultat} onChange={v => set('resultat', v)}
                  options={['EN_ATTENTE', 'ADMIS', 'REFUSE'].map(v => ({ v, label: RES_STYLE[v].label, color: RES_STYLE[v].color, bg: RES_STYLE[v].bg,
                    icon: { EN_ATTENTE: 'hourglass-split', ADMIS: 'check-circle-fill', REFUSE: 'x-circle-fill' }[v] }))} />
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <Etiquette>Score</Etiquette>
                  <ChampMontant suffixe="/ 100" placeholder="—" value={form.score} onChange={v => set('score', v)} />
                </div>
                <div className="col-md-8">
                  <Etiquette>Observations</Etiquette>
                  <input className={champCls} value={form.observations} placeholder="Facultatif" onChange={e => set('observations', e.target.value)} />
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}

      {/* ── Fenêtre saisie du résultat ───────────────────────── */}
      {showResModal && (() => {
        const ex = list.find(e => e.id === resId)
        const setR = (k, v) => setResForm(f => ({ ...f, [k]: v }))
        return (
          <FenetreModerne taille={null}
            surTitre="Résultat de l'examen"
            titre={ex?.eleve ? `${ex.eleve.prenom} ${ex.eleve.nom}` : "Résultat de l'examen"}
            icone="clipboard2-check-fill"
            details={[
              ex?.type && ['journal-text', TYPE_STYLE[ex.type]?.label || ex.type],
              ex?.date && ['calendar-event', fmtDate(ex.date)],
              ex?.tentative > 1 && ['arrow-repeat', `${ex.tentative}e tentative`],
            ]}
            onClose={() => setShowResModal(false)} onSave={saveResultat} libelleSave="Valider"
            piedGauche={RES_STYLE[resForm.resultat] && <>Résultat : <strong style={{ color: RES_STYLE[resForm.resultat].color }}>{RES_STYLE[resForm.resultat].label}</strong></>}>
            <Etape n={1} icon="trophy" titre="Résultat">
              <Choix tuiles cols={3} value={resForm.resultat} onChange={v => setR('resultat', v)}
                options={['ADMIS', 'REFUSE', 'EN_ATTENTE'].map(v => ({ v, label: RES_STYLE[v].label, color: RES_STYLE[v].color, bg: RES_STYLE[v].bg,
                  icon: { EN_ATTENTE: 'hourglass-split', ADMIS: 'check-circle-fill', REFUSE: 'x-circle-fill' }[v] }))} />
            </Etape>
            <Etape n={2} icon="pencil-square" titre="Détails">
              <div className="row g-3">
                <div className="col-sm-5">
                  <Etiquette>Score</Etiquette>
                  <ChampMontant suffixe="/ 100" placeholder="—" value={resForm.score} onChange={v => setR('score', v)} />
                </div>
                <div className="col-sm-7">
                  <Etiquette>Observations</Etiquette>
                  <input className={champCls} value={resForm.observations} placeholder="Facultatif"
                    onChange={e => setR('observations', e.target.value)} />
                </div>
              </div>
            </Etape>
          </FenetreModerne>
        )
      })()}
    </div>
  )
}
