import { GROUPES, MODES } from '../contenu/seriesPubliees'

/* Séance : séries d'examen et catalogues des annales à publier, chacun en entraînement et/ou en
   examen blanc (une puce par mode). */
const carte = { boxShadow: '0 2px 12px rgba(15,34,64,.07)', border: '1px solid #eef2f7' }

export default function ChoixSeries({ series, onChange }) {
  const coche = (id, mode) => series.some(x => x.serie === id && x.mode === mode)
  const basculer = (id, mode) => onChange(coche(id, mode) ? series.filter(x => !(x.serie === id && x.mode === mode)) : [...series, { serie: id, mode }])
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={carte}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #eef2f7' }}>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7', color: '#b45309' }}><i className="bi bi-journal-bookmark-fill" /></span>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold" style={{ color: '#1e3a5f' }}>Annales et séries d'examen</div>
          <div className="text-xs text-slate-500">Choisissez pour chaque série : entraînement, examen blanc, ou les deux</div>
        </div>
        {series.length > 0 && <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: '#1e3a5f', color: '#fff' }}>{series.length}</span>}
      </div>
      {GROUPES.filter(g => g.series.length).map(g => (
        <div key={g.titre} className="px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">{g.titre} <span className="normal-case font-semibold tracking-normal">· {g.sousTitre}</span></div>
          <div className="space-y-2">
            {g.series.map(s => {
              const actif = MODES.some(m => coche(s.id, m.key))
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 rounded-xl" style={{ background: actif ? '#f8fafc' : '#fff', border: `1.5px solid ${actif ? '#cbd5e1' : '#eef2f7'}` }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-sm font-black text-white" style={{ borderRadius: 12, background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)' }}>{s.titre.split(' ')[1]}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{s.titre}</div>
                      <div className="text-xs text-slate-500 truncate">{s.sousTitre}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-shrink-0">
                    {MODES.map(m => {
                      const on = coche(s.id, m.key)
                      return (
                        <button key={m.key} type="button" onClick={() => basculer(s.id, m.key)} aria-pressed={on}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                          style={{ borderRadius: 999, border: `1.5px solid ${on ? m.couleur : '#e2e8f0'}`, background: on ? m.fond : '#fff', color: on ? m.couleur : '#64748b' }}>
                          <i className={`bi bi-${on ? 'check-circle-fill' : m.icone}`} />{m.libelle}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
