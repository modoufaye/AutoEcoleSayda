package sn.autoecole.enums;

/**
 * Bureau de rattachement d'un élève (appelé « site » dans le code et l'API, « bureau » à l'écran).
 * Les noms des constantes sont stockés en base : on change les libellés, pas les constantes.
 */
public enum Site {
    MAZALIK_JINAN("Massalikoul Djinane"),
    /** Bureau fermé : conservé pour que les élèves déjà rattachés restent lisibles ; plus assignable. */
    @Deprecated
    GUEDIAWAYE("Guédiawaye"),
    KEUR_MASSAR("Keur Massar");

    private final String libelle;

    Site(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
