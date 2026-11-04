import { useState } from 'react'
import SeriesExamen from './SeriesExamen'

/* Onglet « Travaux Dirigés » : les exercices des moniteurs (vue propre à chaque rôle, passée en
   enfant et inchangée) et les séries d'examen de l'auto-école. */
export default function TravauxDiriges({ eleve = false, children }) {
  const [vue, setVue] = useState('exercices')
  const onglets = [['exercices', 'pencil-square', 'Exercices'], ['series', 'stopwatch', "Séries d'examen"]]
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
      {vue === 'exercices' ? children : <SeriesExamen eleve={eleve} />}
    </div>
  )
}
