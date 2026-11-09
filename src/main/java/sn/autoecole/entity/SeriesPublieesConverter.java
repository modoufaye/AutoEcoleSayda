package sn.autoecole.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

/** Les séries publiées dans une séance sont rangées en JSON dans une seule colonne texte. */
@Converter
public class SeriesPublieesConverter implements AttributeConverter<List<SeriePubliee>, String> {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<SeriePubliee> series) {
        if (series == null || series.isEmpty()) return null;
        try { return JSON.writeValueAsString(series); }
        catch (Exception e) { throw new IllegalStateException("Séries illisibles", e); }
    }

    @Override
    public List<SeriePubliee> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try { return JSON.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return new ArrayList<>(); }
    }
}
