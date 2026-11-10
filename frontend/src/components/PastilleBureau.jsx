import { useBureaux } from '../bureaux'

/** Pastille du bureau d'un élève (listes, fiche). */
export default function PastilleBureau({ code }) {
  const { libelle, couleur } = useBureaux()
  if (!code) return null
  const c = couleur(code)
  return (
    <span className="badge" style={{ background: `${c}1a`, color: c, border: `1px solid ${c}55`, fontWeight: 700 }}>
      {libelle(code)}
    </span>
  )
}
