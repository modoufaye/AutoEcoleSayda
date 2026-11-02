package sn.autoecole.enums;

/**
 * Bureau de rattachement d'un élève (appelé « site » dans le code et l'API, « bureau » à l'écran).
 * Les noms des constantes sont stockés en base : on change les libellés, pas les constantes.
 */
public enum Site {
    MAZALIK_JINAN("Massalikoul Djinane"),
    GUEDIAWAYE("Guédiawaye"),
    KEUR_MASSAR("Keur Massar"),
    /** Lieu d'inscription seulement (jamais un bureau) : l'élève est alors suivi par Massalikoul Djinane. */
    EN_LIGNE("En ligne");

    private final String libelle;

    Site(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
