package sn.autoecole.enums;

/** Nature d'une pièce jointe du dossier élève (reprend la liste « Documents remis »). */
public enum TypeDocument {
    /** Dossier complet déposé au Service des Mines : un seul par élève (un nouvel envoi remplace l'ancien). */
    DOSSIER,
    CERT_RESIDENCE,
    CNI,
    GROUPE_SANGUIN,
    VISITE_MEDICALE,
    PHOTO,
    TIMBRE,
    ENROLEMENT,
    DELIVRANCE,
    AUTRE
}
