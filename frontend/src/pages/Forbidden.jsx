import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_BASE } from '../utils'

export default function Forbidden() {
  const navigate = useNavigate()
  const { user } = useAuth()
  /* Page précédente s'il y en a une dans l'application ; ouverte directement, l'accueil de son
     espace (ou la connexion), au lieu d'un navigate(-1) qui ne menait nulle part. */
  const retour = () => (window.history.state?.idx ?? 0) > 0
    ? navigate(-1)
    : navigate(user ? ROLE_BASE[user.role] || '/login' : '/login', { replace: true })
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '4rem' }}></i>
      <h2 className="mt-3">Accès refusé</h2>
      <p className="text-muted">Vous n&apos;avez pas les droits pour accéder à cette page.</p>
      <button className="btn btn-primary" onClick={retour}>
        <i className="bi bi-arrow-left me-2"></i>Retour
      </button>
    </div>
  )
}
