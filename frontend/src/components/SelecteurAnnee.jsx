/* Sélecteur d'année du tableau de bord : ‹ 2026 ›. Les flèches passent à l'année précédente ou
   suivante de la liste (années qui ont des inscrits). avecToutes : « Toutes » après la plus récente
   (valeur ''). */
export default function SelecteurAnnee({ annees, valeur, onChange, avecToutes = false }) {
  const liste = [...new Set(annees.map(String))].sort()
  if (avecToutes) liste.push('')
  const i = liste.indexOf(valeur)
  const libelle = v => (v === '' ? 'Toutes' : v)
  const fleche = (sens, icone, nom) => {
    const cible = i >= 0 ? liste[i + sens] : undefined
    const actif = cible !== undefined
    return (
      <button type="button" disabled={!actif} aria-label={nom} title={actif ? `${nom} : ${libelle(cible)}` : nom}
        onClick={() => actif && onChange(cible)}
        className="w-8 h-8 flex items-center justify-center border-0 transition-colors"
        style={{ borderRadius: 999, padding: 0, background: actif ? 'rgba(255,255,255,.14)' : 'transparent', color: actif ? '#fff' : 'rgba(255,255,255,.3)', cursor: actif ? 'pointer' : 'default' }}>
        <i className={`bi bi-${icone}`} style={{ fontSize: '.8rem' }} />
      </button>
    )
  }
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full flex-shrink-0" role="group" aria-label="Année"
      style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a4f7c)', boxShadow: '0 4px 12px rgba(30,58,95,.25)' }}>
      {fleche(-1, 'chevron-left', 'Année précédente')}
      <span className="px-3 text-sm font-black tabular-nums whitespace-nowrap" style={{ color: '#f0bb2a', letterSpacing: '.04em' }} aria-live="polite">
        <i className="bi bi-calendar3 me-1.5" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.75rem' }} />{libelle(valeur)}
      </span>
      {fleche(1, 'chevron-right', 'Année suivante')}
    </div>
  )
}
