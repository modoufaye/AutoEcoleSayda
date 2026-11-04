import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Lecons from './Lecons'
import CoursCode from './CoursCode'
import { THEMES_CONDUITE } from '../contenu/conduite'

const ENTETE = { titre: 'Apprendre à conduire', decor: ['AB25', 'B14', 'C107'],
  texte: 'Six thèmes, du volant à l\'autoroute : chaque chapitre a une leçon, des repères et un quiz pour valider.' }

/* Onglet « Cours Conduite » : le planning des leçons (inchangé) et le parcours « Apprendre à
   conduire » (thèmes, chapitres, quiz), ouvert à tous ceux qui voient l'onglet, élèves en
   perfectionnement compris. */
export default function CoursConduite({ onBack }) {
  const { user } = useAuth()
  const [vue, setVue] = useState('lecons')
  const onglets = [['lecons', 'calendar2-check', 'Mes leçons'], ['apprendre', 'mortarboard-fill', 'Apprendre à conduire']]
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
      {vue === 'lecons'
        ? <Lecons onBack={onBack} />
        : <CoursCode themes={THEMES_CONDUITE} entete={ENTETE} eleve={user?.role === 'ELEVE'} onRetour={onBack} />}
    </div>
  )
}
