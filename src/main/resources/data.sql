-- ══════════════════════════════════════════════════════════
-- MONITEURS (3)
-- ══════════════════════════════════════════════════════════
INSERT INTO moniteurs (nom, prenom, telephone, email, numero_cni, numero_permis, date_embauche, actif)
SELECT 'Diallo', 'Mamadou', '771234567', 'mamadou.diallo@autoecole.sn', '1234567890123', 'SN-B-001', '2020-01-15', true
WHERE NOT EXISTS (SELECT 1 FROM moniteurs WHERE telephone = '771234567');

INSERT INTO moniteurs (nom, prenom, telephone, email, numero_cni, numero_permis, date_embauche, actif)
SELECT 'Ndiaye', 'Fatou', '772345678', 'fatou.ndiaye@autoecole.sn', '9876543210987', 'SN-B-002', '2021-03-10', true
WHERE NOT EXISTS (SELECT 1 FROM moniteurs WHERE telephone = '772345678');

INSERT INTO moniteurs (nom, prenom, telephone, email, numero_cni, numero_permis, date_embauche, actif)
SELECT 'Mbaye', 'Ibrahima', '773456789', 'ibrahima.mbaye@autoecole.sn', '1122334455667', 'SN-C-001', '2019-06-01', true
WHERE NOT EXISTS (SELECT 1 FROM moniteurs WHERE telephone = '773456789');

-- Catégories des moniteurs
INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'B' FROM moniteurs m WHERE m.telephone = '771234567'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'B');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'A' FROM moniteurs m WHERE m.telephone = '771234567'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'A');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'B' FROM moniteurs m WHERE m.telephone = '772345678'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'B');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'A1' FROM moniteurs m WHERE m.telephone = '772345678'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'A1');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'C' FROM moniteurs m WHERE m.telephone = '773456789'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'C');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'B' FROM moniteurs m WHERE m.telephone = '773456789'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'B');

INSERT INTO moniteur_categories (moniteur_id, categorie)
SELECT m.id, 'D' FROM moniteurs m WHERE m.telephone = '773456789'
AND NOT EXISTS (SELECT 1 FROM moniteur_categories mc WHERE mc.moniteur_id = m.id AND mc.categorie = 'D');

-- ══════════════════════════════════════════════════════════
-- VÉHICULES
-- ══════════════════════════════════════════════════════════
INSERT INTO vehicules (immatriculation, marque, modele, annee, categorie, kilometrage, statut)
SELECT 'DK-2341-AB', 'Toyota', 'Corolla', 2020, 'B', 45000, 'DISPONIBLE'
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = 'DK-2341-AB');

INSERT INTO vehicules (immatriculation, marque, modele, annee, categorie, kilometrage, statut)
SELECT 'DK-1872-CD', 'Renault', 'Clio', 2019, 'B', 67000, 'DISPONIBLE'
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = 'DK-1872-CD');

INSERT INTO vehicules (immatriculation, marque, modele, annee, categorie, kilometrage, statut)
SELECT 'DK-5521-EF', 'Honda', 'CB125', 2021, 'A1', 12000, 'DISPONIBLE'
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = 'DK-5521-EF');

INSERT INTO vehicules (immatriculation, marque, modele, annee, categorie, kilometrage, statut)
SELECT 'DK-3309-GH', 'Mercedes', 'Actros', 2018, 'C', 120000, 'DISPONIBLE'
WHERE NOT EXISTS (SELECT 1 FROM vehicules WHERE immatriculation = 'DK-3309-GH');

-- ══════════════════════════════════════════════════════════
-- ÉLÈVES (50) — répartis sur les 3 moniteurs
-- ══════════════════════════════════════════════════════════

-- ── Élèves existants (4) ─────────────────────────────────
INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sarr', 'Aminata', '1998-05-12', '775678901', 'Dakar, Plateau', 'aminata.sarr@gmail.com', '2233445566778', 'B', '2026-01-10', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '775678901');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Fall', 'Oumar', '1995-11-25', '776789012', 'Dakar, Sicap Liberté', 'oumar.fall@gmail.com', '3344556677889', 'B', '2026-02-14', 'EN_COURS', 8, 6,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '776789012');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Gueye', 'Sokhna', '2000-03-08', '777890123', 'Dakar, Parcelles Assainies', 'sokhna.gueye@gmail.com', '4455667788990', 'A1', '2026-03-01', 'EN_COURS', 3, 2,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '777890123');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ba', 'Moussa', '1992-07-19', '778901234', 'Dakar, Médina', 'moussa.ba@gmail.com', '5566778899001', 'C', '2025-10-05', 'DIPLOME', 15, 20,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '778901234');

-- ── Moniteur Diallo Mamadou — 16 élèves ──────────────────

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diallo', 'Aissatou', '1999-03-15', '770100001', 'Dakar, Médina', 'aissatou.diallo@test.sn', '1100000000001', 'B', '2025-09-01', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100001');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ndiaye', 'Boubacar', '1996-07-22', '770100002', 'Dakar, Plateau', 'boubacar.ndiaye@test.sn', '1100000000002', 'B', '2025-10-15', 'EN_COURS', 8, 5,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100002');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Fall', 'Mariama', '2001-11-08', '770100003', 'Dakar, Yoff', 'mariama.fall@test.sn', '1100000000003', 'B', '2026-01-20', 'EN_COURS', 4, 2,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100003');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Mbaye', 'Oumar', '1993-05-30', '770100004', 'Dakar, Parcelles Assainies', 'oumar.mbaye@test.sn', '1100000000004', 'B', '2024-06-10', 'DIPLOME', 15, 18,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100004');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sy', 'Aminata', '2000-09-14', '770100005', 'Dakar, Pikine', 'aminata.sy@test.sn', '1100000000005', 'B', '2025-11-05', 'EN_COURS', 7, 3,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100005');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sow', 'Cheikh', '1997-02-28', '770100006', 'Dakar, Guédiawaye', 'cheikh.sow@test.sn', '1100000000006', 'B', '2025-08-20', 'EN_COURS', 9, 6,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100006');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Cisse', 'Pape', '1994-12-17', '770100007', 'Dakar, Liberté 6', 'pape.cisse@test.sn', '1100000000007', 'B', '2026-02-10', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100007');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Gueye', 'Adja', '1998-06-25', '770100008', 'Dakar, Ouakam', 'adja.gueye@test.sn', '1100000000008', 'B', '2024-09-05', 'DIPLOME', 14, 16,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100008');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Wade', 'Lamine', '1991-04-09', '770100009', 'Dakar, Almadies', 'lamine.wade@test.sn', '1100000000009', 'B', '2025-07-15', 'SUSPENDU', 3, 2,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100009');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Faye', 'Rokhaya', '2002-08-19', '770100010', 'Dakar, Sicap Liberté', 'rokhaya.faye@test.sn', '1100000000010', 'B', '2026-03-08', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100010');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sene', 'Abdoulaye', '1995-10-03', '770100011', 'Dakar, Grand Dakar', 'abdoulaye.sene@test.sn', '1100000000011', 'B', '2025-05-22', 'EN_COURS', 10, 7,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100011');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diouf', 'Khady', '1999-01-27', '770100012', 'Dakar, HLM', 'khady.diouf@test.sn', '1100000000012', 'B', '2025-12-01', 'EN_COURS', 7, 5,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100012');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Samb', 'Modou', '1992-07-11', '770100013', 'Dakar, Dieuppeul', 'modou.samb@test.sn', '1100000000013', 'B', '2024-12-15', 'EN_COURS', 11, 8,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100013');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Traore', 'Yacine', '2003-04-16', '770100014', 'Dakar, Mermoz', 'yacine.traore@test.sn', '1100000000014', 'A', '2024-07-20', 'DIPLOME', 12, 14,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100014');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Toure', 'Papa', '1988-09-05', '770100015', 'Dakar, Sacré Coeur', 'papa.toure@test.sn', '1100000000015', 'B', '2026-04-10', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100015');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Badji', 'Seynabou', '2001-12-30', '770100016', 'Dakar, Ngor', 'seynabou.badji@test.sn', '1100000000016', 'B', '2026-04-25', 'EN_COURS', 4, 2,
  (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '770100016');

-- ── Moniteur Ndiaye Fatou — 16 élèves ────────────────────

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Coly', 'Serigne', '1997-08-14', '761100001', 'Dakar, Grand Yoff', 'serigne.coly@test.sn', '1100000000017', 'B', '2025-10-08', 'EN_COURS', 7, 5,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100001');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sagna', 'Fatoumata', '2000-05-21', '761100002', 'Dakar, Camberene', 'fatoumata.sagna@test.sn', '1100000000018', 'B', '2025-11-18', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100002');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Drame', 'Babacar', '1990-03-12', '761100003', 'Dakar, Thiaroye', 'babacar.drame@test.sn', '1100000000019', 'B', '2024-05-14', 'DIPLOME', 16, 19,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100003');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diop', 'Ndeye', '1998-11-27', '761100004', 'Dakar, Mbao', 'ndeye.diop@test.sn', '1100000000020', 'B', '2025-09-22', 'EN_COURS', 8, 5,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100004');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Lo', 'Alioune', '1994-06-08', '761100005', 'Dakar, Keur Massar', 'alioune.lo@test.sn', '1100000000021', 'B', '2025-07-30', 'EN_COURS', 9, 6,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100005');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ngom', 'Coumba', '2002-02-15', '761100006', 'Dakar, Médina', 'coumba.ngom@test.sn', '1100000000022', 'B', '2026-01-10', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100006');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ndao', 'Samba', '1996-09-03', '761100007', 'Dakar, Plateau', 'samba.ndao@test.sn', '1100000000023', 'B', '2025-06-20', 'SUSPENDU', 4, 3,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100007');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diagne', 'Astou', '1999-07-19', '761100008', 'Dakar, Yoff', 'astou.diagne@test.sn', '1100000000024', 'B', '2025-12-05', 'EN_COURS', 7, 5,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100008');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Camara', 'Pathe', '1993-12-25', '761100009', 'Dakar, Parcelles Assainies', 'pathe.camara@test.sn', '1100000000025', 'B', '2025-04-15', 'EN_COURS', 10, 8,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100009');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Konate', 'Binta', '2001-04-08', '761100010', 'Dakar, Pikine', 'binta.konate@test.sn', '1100000000026', 'A1', '2026-02-28', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100010');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Kone', 'Idrissa', '1991-10-16', '761100011', 'Dakar, Guédiawaye', 'idrissa.kone@test.sn', '1100000000027', 'B', '2024-08-10', 'DIPLOME', 13, 17,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100011');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Thiaw', 'Penda', '2000-08-30', '761100012', 'Dakar, Liberté 5', 'penda.thiaw@test.sn', '1100000000028', 'B', '2026-03-15', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100012');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Deme', 'Malick', '1995-01-22', '761100013', 'Dakar, Ouakam', 'malick.deme@test.sn', '1100000000029', 'B', '2025-10-28', 'EN_COURS', 8, 6,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100013');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Tendeng', 'Mame', '1987-06-17', '761100014', 'Dakar, Almadies', 'mame.tendeng@test.sn', '1100000000030', 'B', '2024-11-05', 'ABANDONNE', 2, 1,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100014');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sarr', 'El Hadji', '1989-03-04', '761100015', 'Dakar, Sacré Coeur', 'elhadji.sarr@test.sn', '1100000000031', 'B', '2025-08-08', 'EN_COURS', 11, 9,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100015');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Fall', 'Nabou', '2003-09-11', '761100016', 'Dakar, Grand Dakar', 'nabou.fall@test.sn', '1100000000032', 'B', '2026-05-01', 'EN_COURS', 4, 2,
  (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '761100016');

-- ── Moniteur Mbaye Ibrahima — 14 élèves ──────────────────

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ba', 'Seydou', '1994-07-25', '782100001', 'Dakar, HLM Grand Yoff', 'seydou.ba@test.sn', '1100000000033', 'B', '2025-11-10', 'EN_COURS', 7, 5,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100001');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diallo', 'Demba', '1998-04-18', '782100002', 'Dakar, Dieuppeul', 'demba.diallo@test.sn', '1100000000034', 'B', '2025-12-20', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100002');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Ndiaye', 'Bigue', '2001-01-09', '782100003', 'Dakar, Mermoz', 'bigue.ndiaye@test.sn', '1100000000035', 'B', '2026-01-15', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100003');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Mbaye', 'Landing', '1985-11-22', '782100004', 'Dakar, Ngor', 'landing.mbaye@test.sn', '1100000000036', 'D', '2024-04-08', 'DIPLOME', 14, 20,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100004');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sy', 'Bocar', '1992-08-06', '782100005', 'Dakar, Grand Yoff', 'bocar.sy@test.sn', '1100000000037', 'B', '2025-09-14', 'EN_COURS', 9, 7,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100005');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sow', 'Mariama', '2000-03-28', '782100006', 'Dakar, Camberene', 'mariama.sow@test.sn', '1100000000038', 'B', '2025-10-25', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100006');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Gueye', 'Aliou', '1997-06-12', '782100007', 'Dakar, Thiaroye', 'aliou.gueye@test.sn', '1100000000039', 'B', '2025-05-18', 'SUSPENDU', 3, 2,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100007');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Wade', 'Dieynaba', '2002-10-05', '782100008', 'Dakar, Mbao', 'dieynaba.wade@test.sn', '1100000000040', 'B', '2026-02-14', 'EN_COURS', 5, 3,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100008');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Cisse', 'Boubacar', '1996-02-19', '782100009', 'Dakar, Keur Massar', 'boubacar.cisse@test.sn', '1100000000041', 'B', '2025-11-28', 'EN_COURS', 8, 6,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100009');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Faye', 'Rama', '1990-08-14', '782100010', 'Dakar, Pikine Guédiawaye', 'rama.faye@test.sn', '1100000000042', 'B', '2024-10-20', 'DIPLOME', 12, 15,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100010');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Sene', 'Cheikh', '1988-05-30', '782100011', 'Dakar, Plateau', 'cheikh.sene@test.sn', '1100000000043', 'B', '2025-03-10', 'ABANDONNE', 1, 0,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100011');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diouf', 'Fatoumata', '1999-12-03', '782100012', 'Dakar, Yoff', 'fatoumata.diouf@test.sn', '1100000000044', 'B', '2025-12-08', 'EN_COURS', 7, 5,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100012');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Samb', 'Babacar', '2003-07-21', '782100013', 'Dakar, Parcelles Assainies', 'babacar.samb@test.sn', '1100000000045', 'B', '2026-05-15', 'EN_COURS', 4, 3,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100013');

INSERT INTO eleves (nom, prenom, date_naissance, telephone, adresse, email, numero_cni, categorie_permis, date_inscription, statut, nombre_lecons_code, nombre_lecons_conduite, moniteur_id)
SELECT 'Diagne', 'Khady', '1995-09-16', '782100014', 'Dakar, Liberté 1', 'khady.diagne@test.sn', '1100000000046', 'B', '2026-04-20', 'EN_COURS', 6, 4,
  (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE NOT EXISTS (SELECT 1 FROM eleves WHERE telephone = '782100014');

-- ══════════════════════════════════════════════════════════
-- RATTACHEMENT DES ÉLÈVES SANS MONITEUR (anciens enregistrements)
-- ══════════════════════════════════════════════════════════
UPDATE eleves SET moniteur_id = (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE telephone = '775678901' AND moniteur_id IS NULL;

UPDATE eleves SET moniteur_id = (SELECT id FROM moniteurs WHERE telephone = '772345678')
WHERE telephone = '776789012' AND moniteur_id IS NULL;

UPDATE eleves SET moniteur_id = (SELECT id FROM moniteurs WHERE telephone = '773456789')
WHERE telephone = '777890123' AND moniteur_id IS NULL;

UPDATE eleves SET moniteur_id = (SELECT id FROM moniteurs WHERE telephone = '771234567')
WHERE telephone = '778901234' AND moniteur_id IS NULL;
