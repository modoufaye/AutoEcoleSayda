import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import Forbidden from './pages/Forbidden'

function DashboardRouter() {
  return (
    <Routes>
      {/* Le splat « /* » laisse AppLayout lire la section courante dans l'URL
          (ex. /dashboard/admin/eleves/42) — indispensable pour que le bouton
          Retour du navigateur et d'Android navigue au lieu de quitter l'app. */}
      <Route path="admin/*"    element={<PrivateRoute roles={['SUPER_ADMIN']}><AppLayout /></PrivateRoute>} />
      <Route path="moniteur/*" element={<PrivateRoute roles={['MONITEUR']}><AppLayout /></PrivateRoute>} />
      <Route path="eleve/*"    element={<PrivateRoute roles={['ELEVE']}><AppLayout /></PrivateRoute>} />
      <Route path="*"        element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/403"          element={<Forbidden />} />
        <Route path="/dashboard/*"  element={<DashboardRouter />} />
        <Route path="/"             element={<LandingPage />} />
        <Route path="*"             element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}
