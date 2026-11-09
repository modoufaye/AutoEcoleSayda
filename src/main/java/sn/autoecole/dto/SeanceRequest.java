package sn.autoecole.dto;

import sn.autoecole.entity.PartieCode;

import java.util.List;

public record SeanceRequest(
    String titre,
    String dateHeure,
    String theme,
    String statut,
    List<Long> eleveIds,
    List<BlocRequest> blocs,
    List<PartieCode> programme
) {}
