package sn.autoecole.enums;

public enum RoleUser {
    /** Tous les droits, dont la gestion des comptes administrateurs. */
    SUPER_ADMIN,
    /** Administrateur : mêmes droits que le super admin (suppressions, moniteurs, secrétariat, paramètres),
        sauf créer un administrateur ou agir sur un compte super admin. */
    ADMIN,
    MONITEUR,
    ELEVE,
    /** Secrétariat : élèves, leçons, examens, encaissements ; ni moniteurs, ni paramètres, ni suppression définitive. */
    SECRETAIRE
}
