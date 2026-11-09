import { useEffect, useState } from 'react'
import { api } from '../api'
import { seriesOuvertes } from '../contenu/seriesPubliees'
import { ListeChargement } from './ListeModerne'
import { useAuth } from '../context/AuthContext'
import { FenetrePublication, ListePublications } from './PublicationsSeries'
import SeriesExamen from './SeriesExamen'
import { ANNALES } from '../contenu/annales'

/* Onglet « Travaux Dirigés » : les annales (catalogues des questions fréquentes à l'examen) et les
   séries d'examen de l'auto-école, même déroulé (entraînement ou examen blanc). Le personnel voit
   tout ; le super admin, les administrateurs et les moniteurs publient (« + Annales », « + Série
   d'examen ») pour des élèves, qui ne voient que les séries, et les modes, publiés pour eux. */
const ENTETE_ANNALES = {
  surTitre: 'TRAVAUX DIRIGÉS · ANNALES', titre: 'Annales',
  texte: "Les catalogues de questions qui tombent souvent à l'examen du code.",
  vide: "Les catalogues arrivent bientôt : revenez d'ici quelques jours.",
}

export default function TravauxDiriges({ eleve = false, vue: serieOuverte, onOuvrirVue, onFermerVue }) {
  const [onglet, setOnglet] = useState('annales')
  // Série ouverte par l'adresse : son onglet (annales ou séries d'examen) d'après son identifiant
  const vue = serieOuverte ? (serieOuverte.startsWith('annale-') ? 'annales' : 'series') : onglet
  // Changer d'onglet referme la série ouverte
  const setVue = v => { setOnglet(v); if (serieOuverte) onFermerVue?.() }
  const { user } = useAuth()
  const publie = ['SUPER_ADMIN', 'ADMIN', 'MONITEUR'].includes(user?.role)
  const [ouvertes, setOuvertes] = useState(eleve ? null : undefined)
  const [publications, setPublications] = useState([])
  const [fenetre, setFenetre] = useState(null)      // { genre, edition, prerempli }
  const chargerPublications = () => api('GET', '/publications-series').then(setPublications).catch(() => {})
  useEffect(() => {
    if (eleve) api('GET', '/publications-series/mes').then(l => setOuvertes(seriesOuvertes(l))).catch(() => setOuvertes({}))
    else chargerPublications()
  }, [eleve])
  const liste = genre => !eleve && <ListePublications genre={genre} publications={publications} onRecharger={chargerPublications}
    onModifier={p => setFenetre({ genre, edition: p })}
    onAjouterMode={publie ? (p, mode, eleveIds) => setFenetre({ genre, prerempli: { serie: p.serie, modes: [mode], eleveIds } }) : null} />
  const onglets = [['annales', 'journal-bookmark-fill', 'Annales'], ['series', 'stopwatch', "Séries d'examen"]]
  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 p-1 w-full sm:w-auto sm:inline-flex" style={{ background: '#eef2f7', borderRadius: 999 }}>
        {onglets.map(([v, icone, label]) => (
          <button key={v} type="button" onClick={() => setVue(v)}
            className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-extrabold border-0 cursor-pointer whitespace-nowrap"
            style={{ borderRadius: 999, ...(vue === v ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>
            <i className={`bi bi-${icone}`} />{label}
          </button>
        ))}
      </div>
      {publie && (
        <div className="flex gap-2 w-full sm:w-auto sm:ms-auto">
          {[['annales', 'Annales'], ['series', "Série d'examen"]].map(([g, l]) => (
            <button key={g} type="button" onClick={() => { setVue(g); setFenetre({ genre: g }) }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-bold px-3 sm:px-5 border-0 cursor-pointer whitespace-nowrap transition-all hover:-translate-y-0.5"
              style={{ minHeight: 40, borderRadius: 999, color: '#fff', background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
              <i className="bi bi-plus-lg" />{l}
            </button>
          ))}
        </div>
      )}
      </div>
      {fenetre && <FenetrePublication key={`fenetre-${fenetre.edition?.id || fenetre.genre}`} genre={fenetre.genre} edition={fenetre.edition} prerempli={fenetre.prerempli} publications={publications}
        onClose={() => setFenetre(null)} onFini={() => { setFenetre(null); chargerPublications() }} />}
      {ouvertes === null ? <ListeChargement />
        : vue === 'annales' ? <SeriesExamen key="annales" eleve={eleve} series={ANNALES} entete={ENTETE_ANNALES} nomListe="Annales" ouvertes={ouvertes} sousEntete={liste('annales')} vue={serieOuverte} onOuvrirVue={onOuvrirVue} onFermerVue={onFermerVue} />
        : <SeriesExamen key="series" eleve={eleve} ouvertes={ouvertes} sousEntete={liste('series')} vue={serieOuverte} onOuvrirVue={onOuvrirVue} onFermerVue={onFermerVue} />}
    </div>
  )
}
