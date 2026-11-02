/* Demande de confirmation dans le style de l'application, à la place de window.confirm().
   Usage : if (!(await confirmer({ titre, message, details, libelle, ton: 'danger' }))) return
   La fenêtre (HoteConfirmation) est montée une fois dans AppLayout ; sans elle, on retombe
   sur la boîte du navigateur. */
let ouvrir = null

export function enregistrerHote(fn) { ouvrir = fn }

export function confirmer(options) {
  return new Promise(resoudre => {
    if (ouvrir) ouvrir({ ...options, resoudre })
    else resoudre(window.confirm([options.titre, options.message].filter(Boolean).join('\n\n')))
  })
}
