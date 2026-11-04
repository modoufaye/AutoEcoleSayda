import { useAuth } from '../context/AuthContext'
import CoursCode from './CoursCode'

/* Page « Cours Code » : thèmes Signalisation et Priorité, en chapitres avec quiz (CoursCode).
   Les anciens cours enregistrés en base ne sont plus affichés, mais restent dans la base.
   Le thème ou le chapitre ouvert est dans l'URL (…/cours/<clé>) quand la mise en page le gère. */
export default function Cours({ onBack, themeKey, onOuvrirTheme, onFermerTheme }) {
  const { user } = useAuth()
  return (
    <CoursCode eleve={user?.role === 'ELEVE'} onRetour={onBack}
      chapitre={themeKey} onOuvrirChapitre={onOuvrirTheme} onFermerChapitre={onFermerTheme} />
  )
}
