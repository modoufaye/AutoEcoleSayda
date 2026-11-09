import { useState } from 'react'
import SeriesExamen from './SeriesExamen'
import { ANNALES } from '../contenu/annales'

/* Onglet « Travaux Dirigés » : les annales (catalogues des questions fréquentes à l'examen) et les
   séries d'examen de l'auto-école, même déroulé (entraînement ou examen blanc). */
const ENTETE_ANNALES = {
  surTitre: 'TRAVAUX DIRIGÉS · ANNALES', titre: 'Annales',
  texte: "Les catalogues de questions qui tombent souvent à l'examen du code.",
  vide: "Les catalogues arrivent bientôt : revenez d'ici quelques jours.",
}

export default function TravauxDiriges({ eleve = false }) {
  const [vue, setVue] = useState('annales')
  const onglets = [['annales', 'journal-bookmark-fill', 'Annales'], ['series', 'stopwatch', "Séries d'examen"]]
  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex gap-1 p-1 w-full sm:w-auto sm:inline-flex" style={{ background: '#eef2f7', borderRadius: 999 }}>
        {onglets.map(([v, icone, label]) => (
          <button key={v} type="button" onClick={() => setVue(v)}
            className="flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm font-extrabold border-0 cursor-pointer whitespace-nowrap"
            style={{ borderRadius: 999, ...(vue === v ? { background: '#fff', color: '#1e3a5f', boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : { background: 'transparent', color: '#64748b' }) }}>
            <i className={`bi bi-${icone}`} />{label}
          </button>
        ))}
      </div>
      {vue === 'annales' ? <SeriesExamen key="annales" eleve={eleve} series={ANNALES} entete={ENTETE_ANNALES} /> : <SeriesExamen key="series" eleve={eleve} />}
    </div>
  )
}
