package sn.autoecole.enums;

public enum RoleUser {
    SUPER_ADMIN,
    MONITEUR,
    ELEVE,
    /** Secrétariat : élèves, leçons, examens, encaissements ; ni moniteurs, ni paramètres, ni suppression définitive. */
    SECRETAIRE
}
