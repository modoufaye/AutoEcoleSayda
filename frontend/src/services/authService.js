import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Injecte le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Session expirée (401) → on purge et on renvoie vers la connexion.
// Exception : l'échec de la connexion elle-même renvoie aussi 401 ; le
// rediriger rechargerait la page et effacerait le message d'erreur avant
// que l'utilisateur ait pu le lire.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const estRequeteConnexion = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !estRequeteConnexion) {
      ;['token','role','nom','email'].forEach(k => localStorage.removeItem(k))
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const authService = {
  login: (email, motDePasse) =>
    api.post('/auth/login', { email, motDePasse }).then((r) => r.data),

  register: (nom, email, motDePasse, role) =>
    api.post('/auth/register', { nom, email, motDePasse, role }).then((r) => r.data),
}
