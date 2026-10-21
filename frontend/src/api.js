function clearAuthStorage() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('nom')
  localStorage.removeItem('email')
}

export async function uploadFile(url, file, fields = {}) {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(fields).forEach(([k, v]) => { if (v != null) formData.append(k, v) })
  const res = await fetch('/api' + url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (res.status === 401) { clearAuthStorage(); window.location.href = '/login'; return }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || (res.status === 413 ? 'Fichier trop lourd' : 'Erreur upload'))
  return data
}

/** Fichier protégé (pièce jointe élève) : le token doit accompagner la requête, un simple lien ne suffit pas. */
export async function fetchBlob(url) {
  const token = localStorage.getItem('token')
  const res = await fetch('/api' + url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (res.status === 401) { clearAuthStorage(); window.location.href = '/login'; return }
  if (!res.ok) throw new Error('Fichier introuvable')
  return res.blob()
}

export async function api(method, url, body = null) {
  const token = localStorage.getItem('token')
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
  if (body !== null) opts.body = JSON.stringify(body)
  const res = await fetch('/api' + url, opts)
  if (res.status === 204) return null
  if (res.status === 401) {
    clearAuthStorage()
    window.location.href = '/login'
    return
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || (data.erreurs ? JSON.stringify(data.erreurs) : 'Erreur serveur'))
  return data
}
