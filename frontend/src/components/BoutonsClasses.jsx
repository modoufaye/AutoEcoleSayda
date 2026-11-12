import { useClasses } from '../classes'

/* Un bouton par classe : un clic coche tous ses élèves (parmi ceux proposés dans cet écran).
   proposes : ids des élèves que l'écran peut cocher (ex. admis au code pour une conduite) ;
   onCocher(ids) : ids à ajouter aux cochés. Rien ne s'affiche s'il n'y a aucune classe. */
export default function BoutonsClasses({ proposes, onCocher, petit = false }) {
  const classes = useClasses().filter(c => c.nombre > 0)
  if (!classes.length) return null
  const ok = proposes ? new Set(proposes.map(Number)) : null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 me-1"><i className="bi bi-collection me-1" />Classes</span>
      {classes.map(c => {
        const ids = ok ? c.eleveIds.filter(id => ok.has(id)) : c.eleveIds
        return (
          <button key={c.id} type="button" disabled={!ids.length} onClick={() => onCocher(ids)}
            title={ids.length ? `Cocher les ${ids.length} élève(s) de « ${c.nom} »` : 'Aucun élève de cette classe ici'}
            className={`filtre filtre-bouton ${petit ? '' : ''}`}
            style={{ minHeight: 30, fontSize: '.78rem', opacity: ids.length ? 1 : .45, background: '#f5f3ff', borderColor: '#c4b5fd', color: '#6d28d9' }}>
            <i className="bi bi-plus-circle" />{c.nom} · {ids.length}
          </button>
        )
      })}
    </div>
  )
}
