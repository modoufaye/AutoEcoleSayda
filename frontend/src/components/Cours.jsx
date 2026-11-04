import { useAuth } from '../context/AuthContext'
import SignalisationCours from './SignalisationCours'

/* Page « Cours Code » : seul le thème Signalisation reste, présenté en chapitres avec quiz
   (SignalisationCours). Les anciens cours enregistrés en base ne sont plus affichés, mais restent
   dans la base. Le chapitre ouvert est dans l'URL (…/cours/<chapitre>) quand la mise en page le gère. */
export default function Cours({ onBack, themeKey, onOuvrirTheme, onFermerTheme }) {
  const { user } = useAuth()
  return (
    <SignalisationCours eleve={user?.role === 'ELEVE'} onRetour={onBack}
      chapitre={themeKey} onOuvrirChapitre={onOuvrirTheme} onFermerChapitre={onFermerTheme} />
  )
}
