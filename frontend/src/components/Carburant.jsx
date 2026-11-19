import { useEffect, useMemo, useState } from 'react'
import { api, uploadFile } from '../api'
import { fmtDate, fmtMontant } from '../utils'
import { toast } from './Toast'
import { confirmer } from './confirmer'
import { FenetreModerne, Etape, Etiquette, ChampMontant } from './FenetreModerne'
import { EnteteListe, LigneListe, BoutonRond, Pastille, ListeVide, ListeChargement, BarreFiltres, Filtre, BoutonAjout } from './ListeModerne'
import { champCls } from './fenetreStyles'

/* Carburant des moniteurs de conduite. L'administration (ou le secrétariat) remet des dotations ;
   le moniteur déclare chaque plein avec la photo du reçu ; l'administration valide ou refuse.
   Reste à justifier = dotations − pleins validés. Par véhicule : consommation et coût par heure de leçon. */

const STATUTS = {
  EN_ATTENTE: { label: 'À valider', couleur: '#a16207', fond: '#fef9c3' },
  VALIDE:     { label: 'Validé',    couleur: '#15803d', fond: '#dcfce7' },
  REFUSE:     { label: 'Refusé',    couleur: '#b91c1c', fond: '#fee2e2' },
}
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const libMois = m => { const [a, n] = m.split('-'); return `${MOIS[Number(n) - 1]} ${a}` }
const aujourdhui = () => new Date().toISOString().slice(0, 10)
const litres = l => l == null ? '-' : `${String(Number(l)).replace('.', ',')} L`
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

function Tuile({ icone, couleur, fond, libelle, valeur, sous }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={carte}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: fond }}>
        <i className={`bi bi-${icone} text-lg`} style={{ color: couleur }} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{libelle}</div>
        <div className="text-base sm:text-lg font-extrabold leading-tight" style={{ color: '#1e3a5f', whiteSpace: 'nowrap' }}>{valeur}</div>
        {sous && <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{sous}</div>}
      </div>
    </div>
  )
}

function Section({ icone, titre, sousTitre, nombre, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <EnteteListe icone={icone} titre={titre} sousTitre={sousTitre} nombre={nombre} />
      {children}
    </div>
  )
}

/* Photo du reçu : envoyée telle quelle (pas de recadrage, tout le ticket doit rester lisible). */
function ChampRecu({ value, onChange }) {
  const [envoi, setEnvoi] = useState(false)
  const choisir = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setEnvoi(true)
    try { onChange((await uploadFile('/moniteur/upload/image', f)).url) }
    catch (err) { toast(err.message || 'Envoi impossible', 'danger') }
    finally { setEnvoi(false) }
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white" style={{ border: '1.5px dashed #cbd5e1' }}>
      {value
        ? <a href={value} target="_blank" rel="noreferrer"><img src={value} alt="Reçu" className="w-16 h-16 rounded-xl" style={{ objectFit: 'cover' }} /></a>
        : <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: '#f1f5f9' }}><i className="bi bi-receipt text-2xl text-slate-400" /></div>}
      <label className="mb-0 px-3 py-2 text-sm font-bold cursor-pointer" style={{ borderRadius: 999, background: '#eff6ff', color: '#1d4ed8' }}>
        <i className={`bi bi-${envoi ? 'hourglass-split' : 'camera-fill'} me-1`} />{envoi ? 'Envoi…' : value ? 'Changer la photo' : 'Photo du reçu'}
        <input type="file" accept="image/*" capture="environment" className="d-none" onChange={choisir} disabled={envoi} />
      </label>
      {value && <button type="button" className="text-xs text-slate-500 bg-transparent border-0 underline cursor-pointer" onClick={() => onChange('')}>Retirer</button>}
    </div>
  )
}

export default function Carburant() {
  const [etat, setEtat] = useState(null)
  const [vehicules, setVehicules] = useState([])
  const [mois, setMois] = useState('')
  const [moniteurFiltre, setMoniteurFiltre] = useState('')
  const [plein, setPlein] = useState(null)        // formulaire de plein ouvert
  const [dotation, setDotation] = useState(null)  // formulaire de dotation ouvert
  const [refus, setRefus] = useState(null)        // { id, motif }

  const charger = () => api('GET', '/carburant').then(setEtat).catch(e => { toast(e.message, 'danger'); setEtat({ erreur: true }) })
  useEffect(() => {
    charger()
    api('GET', '/vehicules').then(v => setVehicules(v || [])).catch(() => setVehicules([]))
  }, [])

  const gestion = !!etat?.gestion
  const tousMois = useMemo(() => {
    if (!etat?.pleins) return []
    return [...new Set([...etat.pleins, ...etat.dotations].map(x => x.date.slice(0, 7)))].sort().reverse()
  }, [etat])

  const historique = useMemo(() => {
    if (!etat?.pleins) return []
    const l = [...etat.pleins.map(p => ({ ...p, genre: 'plein' })), ...etat.dotations.map(d => ({ ...d, genre: 'dotation' }))]
      .filter(x => (!mois || x.date.startsWith(mois)) && (!moniteurFiltre || String(x.moniteurId) === moniteurFiltre))
    return l.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  }, [etat, mois, moniteurFiltre])

  if (!etat) return <ListeChargement />
  if (etat.erreur) return <ListeVide texte="Carburant indisponible" />

  const envoyer = async (methode, url, corps, message) => {
    try { setEtat(await api(methode, url, corps)); if (message) toast(message); return true }
    catch (e) { toast(e.message, 'danger'); return false }
  }

  const ouvrirPlein = p => setPlein(p ? {
    id: p.id, moniteurId: String(p.moniteurId), vehiculeId: p.vehiculeId ? String(p.vehiculeId) : '', date: p.date,
    litres: p.litres != null ? String(p.litres) : '', montant: String(p.montant), kilometrage: p.kilometrage != null ? String(p.kilometrage) : '',
    station: p.station || '', recuUrl: p.recuUrl || '',
  } : {
    moniteurId: moniteurFiltre || '', vehiculeId: etat.moi?.vehiculeId ? String(etat.moi.vehiculeId) : '', date: aujourdhui(),
    litres: '', montant: '', kilometrage: '', station: '', recuUrl: '',
  })

  const enregistrerPlein = async () => {
    const f = plein
    if (gestion && !f.moniteurId) return toast('Choisissez le moniteur', 'warning')
    if (!f.litres || !f.montant) return toast('Indiquez les litres et le montant', 'warning')
    if (!gestion && !f.recuUrl && !(await confirmer({ titre: 'Sans photo du reçu ?', libelle: 'Envoyer quand même', icone: 'receipt',
      message: "Sans la photo du reçu, l'administration pourra refuser ce plein." }))) return
    const ok = await envoyer(f.id ? 'PUT' : 'POST', f.id ? `/carburant/pleins/${f.id}` : '/carburant/pleins', f,
      f.id ? (gestion ? 'Plein modifié' : 'Plein renvoyé pour validation') : gestion ? 'Plein enregistré' : 'Plein envoyé pour validation')
    if (ok) setPlein(null)
  }

  const enregistrerDotation = async () => {
    if (!dotation.moniteurId || !dotation.montant) return toast('Choisissez le moniteur et le montant', 'warning')
    if (await envoyer('POST', '/carburant/dotations', dotation, 'Dotation enregistrée')) setDotation(null)
  }

  const supprimerPlein = async p => {
    if (await confirmer({ titre: 'Supprimer ce plein ?', ton: 'danger', libelle: 'Supprimer', icone: 'trash3-fill',
      message: `${fmtDate(p.date)} · ${fmtMontant(p.montant)} (${p.moniteur})` }))
      envoyer('DELETE', `/carburant/pleins/${p.id}`, undefined, 'Plein supprimé')
  }
  const supprimerDotation = async d => {
    if (await confirmer({ titre: 'Supprimer cette dotation ?', ton: 'danger', libelle: 'Supprimer', icone: 'trash3-fill',
      message: `${fmtDate(d.date)} · ${fmtMontant(d.montant)} pour ${d.moniteur}` }))
      envoyer('DELETE', `/carburant/dotations/${d.id}`, undefined, 'Dotation supprimée')
  }
  const refuser = async () => {
    if (!refus.motif.trim()) return toast('Indiquez le motif du refus', 'warning')
    if (await envoyer('PATCH', `/carburant/pleins/${refus.id}/refuser`, { motif: refus.motif }, 'Plein refusé')) setRefus(null)
  }

  const totaux = etat.moniteurs.reduce((t, m) => ({ dotations: t.dotations + m.dotations, valides: t.valides + m.valides,
    enAttente: t.enAttente + m.enAttente, reste: t.reste + m.reste }), { dotations: 0, valides: 0, enAttente: 0, reste: 0 })
  const aValider = etat.pleins.filter(p => p.statut === 'EN_ATTENTE')
  const setP = (k, v) => setPlein(f => ({ ...f, [k]: v }))
  const setD = (k, v) => setDotation(f => ({ ...f, [k]: v }))

  /* Une ligne de plein (liste « À valider » et historique) */
  const lignePlein = (p, avecActionsValidation) => {
    const st = STATUTS[p.statut] || STATUTS.EN_ATTENTE
    const modifiable = gestion || p.statut !== 'VALIDE'
    return (
      <LigneListe key={`p${p.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          {p.recuUrl
            ? <a href={p.recuUrl} target="_blank" rel="noreferrer" title="Voir le reçu"><img src={p.recuUrl} alt="Reçu" className="w-11 h-11 rounded-xl flex-shrink-0" style={{ objectFit: 'cover' }} /></a>
            : <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff7ed' }} title="Pas de reçu"><i className="bi bi-fuel-pump-fill" style={{ color: '#c2410c' }} /></div>}
          <div className="min-w-0">
            <div className="font-bold text-[#1e3a5f] truncate">{fmtMontant(p.montant)} <span className="text-slate-500 font-semibold">· {litres(p.litres)}</span></div>
            <div className="text-xs text-slate-500 truncate">{fmtDate(p.date)}{gestion && <> · {p.moniteur}</>}{p.station && <> · {p.station}</>}</div>
          </div>
        </div>
        <div className="text-xs min-w-0">
          <div className="text-slate-600 truncate"><i className="bi bi-car-front me-1" />{p.vehicule || 'Véhicule non précisé'}</div>
          <div className="text-slate-400 truncate">
            {p.kilometrage != null ? <>Compteur {p.kilometrage.toLocaleString('fr-FR')} km</> : 'Compteur non renseigné'}
            {p.consommation != null && <> · {String(p.consommation).replace('.', ',')} L/100 km</>}
          </div>
        </div>
        <div className="text-xs min-w-0">
          {p.alerte && <div className="font-semibold" style={{ color: '#b45309' }}><i className="bi bi-exclamation-triangle-fill me-1" />{p.alerte}</div>}
          {p.statut === 'REFUSE' && p.motifRefus && <div style={{ color: '#b91c1c' }}><i className="bi bi-x-circle me-1" />{p.motifRefus}</div>}
          {!p.recuUrl && p.statut === 'EN_ATTENTE' && <div className="text-slate-400"><i className="bi bi-receipt me-1" />Sans reçu</div>}
          {p.traitePar && p.statut !== 'EN_ATTENTE' && <div className="text-slate-400 truncate">{st.label} par {p.traitePar}</div>}
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Pastille couleur={st.couleur} fond={st.fond}>{st.label}</Pastille>
          <div className="flex items-center gap-1.5">
            {avecActionsValidation && gestion && <>
              <BoutonRond title="Valider" icon="check-lg" couleur="#15803d" fond="#dcfce7" onClick={() => envoyer('PATCH', `/carburant/pleins/${p.id}/valider`, undefined, 'Plein validé')} />
              <BoutonRond title="Refuser" icon="x-lg" couleur="#b91c1c" fond="#fee2e2" onClick={() => setRefus({ id: p.id, motif: '' })} />
            </>}
            {modifiable && <BoutonRond title={!gestion && p.statut === 'REFUSE' ? 'Corriger et renvoyer' : 'Modifier'} icon="pencil-fill" couleur="#2563eb" fond="#eff6ff" onClick={() => ouvrirPlein(p)} />}
            {(gestion || p.statut !== 'VALIDE') && <BoutonRond title="Supprimer" icon="trash3-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimerPlein(p)} />}
          </div>
        </div>
      </LigneListe>
    )
  }

  const ligneDotation = d => (
    <LigneListe key={`d${d.id}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfdf5' }}><i className="bi bi-wallet2" style={{ color: '#059669' }} /></div>
        <div className="min-w-0">
          <div className="font-bold text-[#1e3a5f] truncate">+ {fmtMontant(d.montant)}</div>
          <div className="text-xs text-slate-500 truncate">{fmtDate(d.date)}{gestion && <> · {d.moniteur}</>}</div>
        </div>
      </div>
      <div className="text-xs text-slate-600 min-w-0 truncate">Dotation carburant{d.note && <> · {d.note}</>}</div>
      <div className="text-xs text-slate-400 min-w-0 truncate">{d.donneePar && <>Remise par {d.donneePar}</>}</div>
      <div className="flex items-center justify-between md:justify-end gap-2">
        <Pastille couleur="#047857" fond="#d1fae5">Dotation</Pastille>
        {gestion && <BoutonRond title="Supprimer" icon="trash3-fill" couleur="#b91c1c" fond="#fee2e2" onClick={() => supprimerDotation(d)} />}
      </div>
    </LigneListe>
  )

  const moi = !gestion ? etat.moniteurs[0] : null
  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Chiffres clés */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile icone="wallet2" couleur="#059669" fond="#ecfdf5" libelle={gestion ? 'Dotations remises' : 'Reçu'} valeur={fmtMontant(totaux.dotations)} />
        <Tuile icone="check-circle-fill" couleur="#15803d" fond="#dcfce7" libelle="Pleins validés" valeur={fmtMontant(totaux.valides)} />
        <Tuile icone="hourglass-split" couleur="#a16207" fond="#fef9c3" libelle="En attente" valeur={fmtMontant(totaux.enAttente)}
          sous={`${aValider.length} plein${aValider.length > 1 ? 's' : ''} à valider`} />
        <Tuile icone="cash-coin" couleur={totaux.reste < 0 ? '#b91c1c' : '#1d4ed8'} fond={totaux.reste < 0 ? '#fee2e2' : '#dbeafe'}
          libelle="Reste à justifier" valeur={fmtMontant(totaux.reste)} sous={totaux.reste < 0 ? 'Pleins validés au-delà des dotations' : undefined} />
      </div>

      <BarreFiltres>
        <Filtre icone="calendar3" value={mois} onChange={setMois}>
          <option value="">Tous les mois</option>
          {tousMois.map(m => <option key={m} value={m}>{libMois(m)}</option>)}
        </Filtre>
        {gestion && (
          <Filtre icone="person-badge" value={moniteurFiltre} onChange={setMoniteurFiltre}>
            <option value="">Tous les moniteurs</option>
            {etat.moniteurs.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </Filtre>
        )}
        <div className="flex gap-2 ms-auto flex-wrap">
          {gestion && <BoutonAjout vert onClick={() => setDotation({ moniteurId: moniteurFiltre || '', date: aujourdhui(), montant: '', note: '' })} icone="wallet2">Dotation</BoutonAjout>}
          <BoutonAjout onClick={() => ouvrirPlein(null)} icone="fuel-pump-fill">Plein</BoutonAjout>
        </div>
      </BarreFiltres>

      {gestion && aValider.length > 0 && (
        <Section icone="hourglass-split" titre="Pleins à valider" sousTitre="Vérifiez le reçu, puis validez ou refusez" nombre={aValider.length}>
          {aValider.map(p => lignePlein(p, true))}
        </Section>
      )}

      {gestion ? (
        <Section icone="person-badge-fill" titre="Moniteurs de conduite" sousTitre="Dotations et pleins justifiés" nombre={etat.moniteurs.length}>
          {etat.moniteurs.length === 0 ? <ListeVide texte="Aucun moniteur de conduite" /> : etat.moniteurs.map(m => (
            <LigneListe key={m.id}>
              <div className="min-w-0">
                <div className="font-bold text-[#1e3a5f] truncate">{m.nom}</div>
                <div className="text-xs text-slate-500 truncate"><i className="bi bi-car-front me-1" />{m.vehicule || 'Pas de véhicule attitré'}</div>
              </div>
              <div className="text-xs min-w-0">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Reçu / validé</div>
                <div className="text-slate-700 font-semibold">{fmtMontant(m.dotations)} / {fmtMontant(m.valides)}</div>
              </div>
              <div className="text-xs min-w-0">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Reste à justifier</div>
                <div className="font-extrabold" style={{ color: m.reste < 0 ? '#b91c1c' : m.reste > 0 ? '#1d4ed8' : '#15803d' }}>{fmtMontant(m.reste)}</div>
                {m.enAttente > 0 && <div className="text-[11px]" style={{ color: '#a16207' }}>{fmtMontant(m.enAttente)} en attente</div>}
              </div>
              <div className="flex items-center md:justify-end gap-1.5">
                <BoutonRond title="Donner une dotation" icon="wallet2" couleur="#059669" fond="#ecfdf5" onClick={() => setDotation({ moniteurId: String(m.id), date: aujourdhui(), montant: '', note: '' })} />
                <BoutonRond title="Voir son historique" icon="list-ul" couleur="#1e3a5f" fond="#eff6ff" onClick={() => setMoniteurFiltre(String(m.id))} />
              </div>
            </LigneListe>
          ))}
        </Section>
      ) : moi && (
        <div className="bg-white rounded-2xl px-4 py-3 text-sm text-slate-600" style={carte}>
          <i className="bi bi-info-circle me-1" style={{ color: '#1d4ed8' }} />
          Déclarez chaque plein avec la photo du reçu et le compteur du véhicule. L'administration le valide, puis il est déduit de votre reste à justifier.
        </div>
      )}

      {etat.vehicules.length > 0 && (
        <Section icone="speedometer2" titre="Consommation des véhicules" sousTitre="D'un plein à l'autre, grâce au compteur" nombre={etat.vehicules.length}>
          {etat.vehicules.map(v => (
            <LigneListe key={v.id}>
              <div className="min-w-0">
                <div className="font-bold text-[#1e3a5f] truncate"><i className="bi bi-car-front-fill me-1" />{v.libelle}</div>
                <div className="text-xs text-slate-500">{v.pleins} plein{v.pleins > 1 ? 's' : ''}{v.dernierKm != null && <> · compteur {v.dernierKm.toLocaleString('fr-FR')} km</>}</div>
              </div>
              <div className="text-xs min-w-0">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Consommation</div>
                <div className="font-extrabold text-slate-700">{v.consommation != null ? `${String(v.consommation).replace('.', ',')} L/100 km` : 'Il faut 2 pleins avec compteur'}</div>
                {v.km > 0 && <div className="text-[11px] text-slate-400">sur {v.km.toLocaleString('fr-FR')} km</div>}
              </div>
              <div className="text-xs min-w-0">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Carburant validé</div>
                <div className="font-semibold text-slate-700">{fmtMontant(v.montant)} · {litres(v.litres)}</div>
              </div>
              <div className="text-xs min-w-0 md:text-right">
                <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Par heure de leçon</div>
                <div className="font-extrabold" style={{ color: '#1e3a5f' }}>{v.coutHeure != null ? fmtMontant(v.coutHeure) : '-'}</div>
                <div className="text-[11px] text-slate-400">{String(v.heuresLecons).replace('.', ',')} h de leçons</div>
              </div>
            </LigneListe>
          ))}
        </Section>
      )}

      <Section icone="clock-history" titre="Historique" sousTitre={mois ? libMois(mois) : 'Pleins et dotations'} nombre={historique.length}>
        {historique.length === 0 ? <ListeVide texte="Aucun plein ni dotation" icone="fuel-pump" />
          : historique.map(x => x.genre === 'plein' ? lignePlein(x, x.statut === 'EN_ATTENTE') : ligneDotation(x))}
      </Section>

      {plein && (
        <FenetreModerne surTitre={plein.id ? 'Modifier le plein' : 'Nouveau plein'} titre="Carburant" icone="fuel-pump-fill"
          onClose={() => setPlein(null)} onSave={enregistrerPlein} libelleSave={plein.id || gestion ? 'Enregistrer' : 'Envoyer'}
          piedGauche={gestion ? 'Saisi par l\'administration : validé directement' : 'Envoyé à l\'administration pour validation'}>
          <Etape n={1} icon="receipt" titre="Le plein">
            <div className="row g-3">
              {gestion && (
                <div className="col-12">
                  <Etiquette requis>Moniteur</Etiquette>
                  <select className={champCls} value={plein.moniteurId} onChange={e => {
                    const m = etat.moniteurs.find(x => String(x.id) === e.target.value)
                    setPlein(f => ({ ...f, moniteurId: e.target.value, vehiculeId: m?.vehiculeId ? String(m.vehiculeId) : f.vehiculeId }))
                  }}>
                    <option value="">Choisir…</option>
                    {etat.moniteurs.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>
              )}
              <div className="col-md-6">
                <Etiquette requis>Date</Etiquette>
                <input type="date" max={aujourdhui()} className={champCls} value={plein.date} onChange={e => setP('date', e.target.value)} />
              </div>
              <div className="col-md-6">
                <Etiquette>Véhicule</Etiquette>
                <select className={champCls} value={plein.vehiculeId} onChange={e => setP('vehiculeId', e.target.value)}>
                  <option value="">Non précisé</option>
                  {vehicules.map(v => <option key={v.id} value={v.id}>{[v.marque, v.modele].filter(Boolean).join(' ')} · {v.immatriculation}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <Etiquette requis>Montant payé</Etiquette>
                <ChampMontant value={plein.montant} onChange={v => setP('montant', v)} placeholder="20 000" />
              </div>
              <div className="col-md-6">
                <Etiquette requis>Litres</Etiquette>
                <div className="relative">
                  <input type="number" step="0.01" min="0" inputMode="decimal" className={champCls} style={{ paddingRight: '2.5rem' }} placeholder="25"
                    value={plein.litres} onChange={e => setP('litres', e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                </div>
              </div>
              <div className="col-md-6">
                <Etiquette>Compteur du véhicule</Etiquette>
                <div className="relative">
                  <input type="number" min="0" inputMode="numeric" className={champCls} style={{ paddingRight: '3rem' }} placeholder="125 400"
                    value={plein.kilometrage} onChange={e => setP('kilometrage', e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Sert à calculer la consommation</div>
              </div>
              <div className="col-md-6">
                <Etiquette>Station</Etiquette>
                <input className={champCls} value={plein.station} placeholder="Total Keur Massar" onChange={e => setP('station', e.target.value)} />
              </div>
            </div>
          </Etape>
          <Etape n={2} icon="camera" titre="Reçu de la station">
            <ChampRecu value={plein.recuUrl} onChange={v => setP('recuUrl', v)} />
          </Etape>
        </FenetreModerne>
      )}

      {dotation && (
        <FenetreModerne surTitre="Nouvelle dotation" titre="Carburant" icone="wallet2" onClose={() => setDotation(null)} onSave={enregistrerDotation}
          piedGauche="Le moniteur la justifiera par ses pleins">
          <Etape n={1} icon="wallet2" titre="Somme remise au moniteur">
            <div className="row g-3">
              <div className="col-12">
                <Etiquette requis>Moniteur</Etiquette>
                <select className={champCls} value={dotation.moniteurId} onChange={e => setD('moniteurId', e.target.value)}>
                  <option value="">Choisir…</option>
                  {etat.moniteurs.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <Etiquette requis>Montant</Etiquette>
                <ChampMontant value={dotation.montant} onChange={v => setD('montant', v)} placeholder="50 000" />
              </div>
              <div className="col-md-6">
                <Etiquette>Date</Etiquette>
                <input type="date" className={champCls} value={dotation.date} onChange={e => setD('date', e.target.value)} />
              </div>
              <div className="col-12">
                <Etiquette>Note</Etiquette>
                <input className={champCls} value={dotation.note} placeholder="Semaine du 23 novembre" onChange={e => setD('note', e.target.value)} />
              </div>
            </div>
          </Etape>
        </FenetreModerne>
      )}

      {refus && (
        <FenetreModerne surTitre="Refuser le plein" titre="Motif du refus" icone="x-circle" taille="" onClose={() => setRefus(null)} onSave={refuser}
          libelleSave="Refuser" piedGauche="Le moniteur verra ce motif">
          <Etape n={1} icon="chat-left-text" titre="Pourquoi ce plein est-il refusé ?">
            <textarea className={champCls} rows={3} autoFocus value={refus.motif} placeholder="Reçu illisible, montant différent du reçu…"
              onChange={e => setRefus(r => ({ ...r, motif: e.target.value }))} />
          </Etape>
        </FenetreModerne>
      )}
    </div>
  )
}
