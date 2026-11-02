/* Styles partagés des fenêtres modernes (FenetreModerne.jsx). */

export const champCls = 'w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-[#d4a017] transition-all'

/* Style d'un bouton-choix : bordure et fond colorés quand il est sélectionné. */
export function stylePastille(actif, color = '#1e3a5f', bg = '#eff6ff') {
  return {
    borderRadius: '.85rem', border: `2px solid ${actif ? color : '#e2e8f0'}`,
    background: actif ? bg : '#fff', color: actif ? color : '#64748b', transition: 'all .15s',
  }
}
