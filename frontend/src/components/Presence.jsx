/* Pastille « En ligne » / « Hors ligne » (listes des élèves et des moniteurs ; voir presence.js). */
export function BadgePresence({ enLigne }) {
  return (
    <span title={enLigne ? 'Connecté en ce moment' : 'Pas connecté en ce moment'}
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={enLigne ? { background: '#dcfce7', color: '#15803d' } : { background: '#f1f5f9', color: '#94a3b8' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: enLigne ? '#22c55e' : '#cbd5e1', boxShadow: enLigne ? '0 0 0 3px rgba(34,197,94,.2)' : 'none' }} />
      {enLigne ? 'En ligne' : 'Hors ligne'}
    </span>
  )
}
