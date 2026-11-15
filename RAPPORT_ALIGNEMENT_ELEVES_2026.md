# Rapport d'alignement des classes & cours élèves (Firestore)

- **Profils vérifiés / traités** : 87
- **Profils modifiés ou fusionnés** : 85
- **Comptes non listés passés en classe `0`** : 42
- **Devoirs (`submissions`) réalignés sur la bonne classe** : 130

## 1. Anomalies détectées

1. **Doublon dans votre liste fournie** : le groupe 1 et le groupe 3 (3e année) contenaient les mêmes 18 élèves (avec `Vermeersch Hugo - QUIT` en plus dans le groupe 1).
- **[NOM_ORTHOGRAPHE]** Compte 'Jassine Ardjouni' (j.ardjouni@iscdl.be) rattaché à 'Ardjouni Yassine' (3GA).
- **[MAUVAIS_COURS_3E_EN_1RE]** Bocklant Zoé (3GB) avait des activités FMTTN 1re dans ses rewarded_activities (conservées sans perte d'XP).
- **[DOUBLONS_FUSIONNES]** Bocklant Zoé (3GB) avait 2 profils: 3CB (0 XP, id=3CB_z_bocklant_iscdl_be) | 3GB (495 XP, id=3GB_z_bocklant_iscdl_be)
- **[MAUVAIS_COURS_3E_EN_1RE]** Catteau Jamie (3GA) avait des activités FMTTN 1re dans ses rewarded_activities (conservées sans perte d'XP).
- **[MAUVAIS_COURS_3E_EN_1RE]** Catteau Kacie (3GB) avait des activités FMTTN 1re dans ses rewarded_activities (conservées sans perte d'XP).
- **[MAUVAIS_COURS_3E_EN_1RE]** Depoortere Jules (3GA) avait des activités FMTTN 1re dans ses rewarded_activities (conservées sans perte d'XP).
- **[DOUBLONS_FUSIONNES]** Devos Sefora (3GC) avait 2 profils: 3C (75 XP, id=3C_s_devos_iscdl_be) | 3GTC (0 XP, id=3GTC_s_devos_iscdl_be)
- **[MAUVAIS_COURS_3E_EN_1RE]** Moulin Louis (3GC) avait des activités FMTTN 1re dans ses rewarded_activities (conservées sans perte d'XP).
- **[DOUBLONS_FUSIONNES]** Thery Thibault (3GC) avait 3 profils: 3CB (0 XP, id=3CB_t_thery_iscdl_be) | 3C (75 XP, id=3C_t_thery_iscdl_be) | 3GTC (0 XP, id=3GTC_t_thery_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Vandeputte Téo (3GC) avait 2 profils: 3C (130 XP, id=3C_te_vandeputte_iscdl_be) | 3GB (130 XP, id=3GB_te_vandeputte_iscdl_be)
- **[ELEVE_QUIT]** Vermeersch Hugo est marqué QUIT dans la liste : déplacé en classe '0' (50 XP conservés).
- **[DOUBLONS_FUSIONNES]** Alioua Massilia (3GD) avait 2 profils: 3GB (50 XP, id=3GB_m_alioua_iscdl_be) | 3GT (85 XP, id=3GT_m_alioua_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Cockenpot Thomas (3GD) avait 2 profils: 3GB (50 XP, id=3GB_t_cockenpot_iscdl_be) | 3GTD (175 XP, id=3GTD_t_cockenpot_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Rinchard Maloé (3GD) avait 2 profils: 3B (25 XP, id=3B_m_rinchard_iscdl_be) | 3GTD (100 XP, id=3GTD_m_rinchard_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Vaye Lou-Eva (3GD) avait 2 profils: 1A (25 XP, id=1A_lo_vaye_iscdl_be) | 3GB (50 XP, id=3GB_lo_vaye_iscdl_be)
- **[DOUBLONS_FUSIONNES]** El Hamri Belgoualia Malak (S1-A) avait 6 profils: 1A (45 XP, id=1A_m_elhamribelgoualia_iscdl_be) | 1B (280 XP, id=1B_m_elhamribelgoualia_iscdl_be) | 1S (45 XP, id=1S_m_elhamribelgoualia_iscdl_be) | 3CB (145 XP, id=3CB_m_elhamribelgoualia_iscdl_be) | 3GB (145 XP, id=3GB_m_elhamribelgoualia_iscdl_be) | 4GT (145 XP, id=4GT_m_elhamribelgoualia_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Francq Oscar (S1-A) avait 2 profils: 1A (2580 XP, id=1A_o_francq_iscdl_be) | 4TTA (2580 XP, id=4TTA_o_francq_iscdl_be)
- **[DOUBLONS_FUSIONNES]** L Auwarier Robin (S1-A) avait 2 profils: 1A (630 XP, id=1A_r_lauwarier_iscdl_be) | 1S (660 XP, id=1S_r_lauwarier_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Oubachir Nayla (S1-A) avait 2 profils: 1A (2365 XP, id=1A_n_oubachir_iscdl_be) | 1S (2365 XP, id=1S_n_oubachir_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Vancaeyzeele Lucien (S1-A) avait 2 profils: 1A (115 XP, id=1A_l_vancaeyzeele_iscdl_be) | 1S (380 XP, id=1S_l_vancaeyzeele_iscdl_be)
- **[DOUBLONS_FUSIONNES]** Vandenhende Valentine (S1-A) avait 4 profils: 1A (650 XP, id=1A_v_vandenhende_iscdl_be) | 1B (115 XP, id=1B_v_vandenhende_iscdl_be) | 1S (650 XP, id=1S_v_vandenhende_iscdl_be) | 3C (115 XP, id=3C_v_vandenhende_iscdl_be)

## 2. Modifications effectuées (élèves de votre liste)

| Élève | Ancien(s) profil(s) | Nouvelle classe | Cours attribués | XP conservés |
|---|---|---|---|---|
| Aitboutssrgal Iyad | 3C (260 XP, id=3C_i_aitboutssrgal_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 260 XP |
| Ardjouni Yassine | 3A (30 XP, id=3A_j_ardjouni_iscdl_be) | **3GA** | dactylo-3e, bureautique-3e | 30 XP |
| Bocklant Zoé | 3CB (0 XP, id=3CB_z_bocklant_iscdl_be)<br>3GB (495 XP, id=3GB_z_bocklant_iscdl_be) | **3GB** | dactylo-3e, bureautique-3e | 495 XP |
| Bouslimi Nicolas | 3C (135 XP, id=3C_n_bouslimi_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 135 XP |
| Cabral Kayenne | 3C (215 XP, id=3C_k_cabral_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 215 XP |
| Catteau Jamie | 3GTA (115 XP, id=3GTA_j_catteau_iscdl_be) | **3GA** | dactylo-3e, bureautique-3e | 115 XP |
| Catteau Kacie *(déjà conforme)* | 3GB (165 XP, id=3GB_k_catteau_iscdl_be) | **3GB** | dactylo-3e, bureautique-3e | 165 XP |
| Depoortere Jules | 3G (115 XP, id=3G_j_depoortere_iscdl_be) | **3GA** | dactylo-3e, bureautique-3e | 115 XP |
| Devos Sefora | 3C (75 XP, id=3C_s_devos_iscdl_be)<br>3GTC (0 XP, id=3GTC_s_devos_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 75 XP |
| Hochepied Mathilde | 3A (190 XP, id=3A_m_hochepied_iscdl_be) | **3GA** | dactylo-3e, bureautique-3e | 190 XP |
| Moulin Louis | 3C (165 XP, id=3C_lo_moulin_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 165 XP |
| Peral Emma | 3C (100 XP, id=3C_e_peral_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 100 XP |
| Peraste Kalisz Gabriel | 3C (25 XP, id=3C_g_perastekalisz_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 25 XP |
| Thery Thibault | 3CB (0 XP, id=3CB_t_thery_iscdl_be)<br>3C (75 XP, id=3C_t_thery_iscdl_be)<br>3GTC (0 XP, id=3GTC_t_thery_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 75 XP |
| Tourbier Taho | 3B (25 XP, id=3B_t_tourbier_iscdl_be) | **3GB** | dactylo-3e, bureautique-3e | 25 XP |
| Treutenaere Stan | 3C (150 XP, id=3C_s_treutenaere_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 150 XP |
| Vandeputte Téo | 3C (130 XP, id=3C_te_vandeputte_iscdl_be)<br>3GB (130 XP, id=3GB_te_vandeputte_iscdl_be) | **3GC** | dactylo-3e, bureautique-3e | 130 XP |
| Verbrugghe Laura *(déjà conforme)* | 3GB (180 XP, id=3GB_l_verbrugghe_iscdl_be) | **3GB** | dactylo-3e, bureautique-3e | 180 XP |
| Vermeersch Hugo | 3C (50 XP, id=3C_h_vermeersch_iscdl_be) | **0** | Aucun (classe 0) | 50 XP |
| Alioua Massilia | 3GB (50 XP, id=3GB_m_alioua_iscdl_be)<br>3GT (85 XP, id=3GT_m_alioua_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 85 XP |
| Bricout Anna | 3GB (95 XP, id=3GB_a_bricout_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 95 XP |
| Cockenpot Thomas | 3GB (50 XP, id=3GB_t_cockenpot_iscdl_be)<br>3GTD (175 XP, id=3GTD_t_cockenpot_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 175 XP |
| Lemaire Luan | 3GB (205 XP, id=3GB_l_lemaire_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 205 XP |
| Osei Audrey | 3GTD (170 XP, id=3GTD_a_osei_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 170 XP |
| Peudevin Léa | 3GB (120 XP, id=3GB_l_peudevin_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 120 XP |
| Rinchard Maloé | 3B (25 XP, id=3B_m_rinchard_iscdl_be)<br>3GTD (100 XP, id=3GTD_m_rinchard_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 100 XP |
| Souvanthong Lison | 3GB (140 XP, id=3GB_l_souvanthong_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 140 XP |
| Vaye Lou-Eva | 1A (25 XP, id=1A_lo_vaye_iscdl_be)<br>3GB (50 XP, id=3GB_lo_vaye_iscdl_be) | **3GD** | dactylo-3e, bureautique-3e | 50 XP |
| Bocquet Eden | 1S (1165 XP, id=1S_e_bocquet_iscdl_be) | **S1-A** | fmttn-1re | 1165 XP |
| Bolombo-Lawa Bradley | 1S (730 XP, id=1S_b_bolombolawa_iscdl_be) | **S1-A** | fmttn-1re | 730 XP |
| Boutoille Lea | 3CB (0 XP, id=3CB_l_boutoille_iscdl_be) | **S1-A** | fmttn-1re | 0 XP |
| Coen Florent | 1A (1905 XP, id=1A_f_coen_iscdl_be) | **S1-A** | fmttn-1re | 1905 XP |
| Coulon Icare | 1S (200 XP, id=1S_i_coulon_iscdl_be) | **S1-A** | fmttn-1re | 200 XP |
| Declercq Natan | 1A (1010 XP, id=1A_na_declercq_iscdl_be) | **S1-A** | fmttn-1re | 1010 XP |
| Dewintere Céléna | 1S (0 XP, id=1S_c_dewintere_iscdl_be) | **S1-A** | fmttn-1re | 0 XP |
| Druart Adam | 1A (1755 XP, id=1A_a_druart_iscdl_be) | **S1-A** | fmttn-1re | 1755 XP |
| El Hamri Belgoualia Malak | 1A (45 XP, id=1A_m_elhamribelgoualia_iscdl_be)<br>1B (280 XP, id=1B_m_elhamribelgoualia_iscdl_be)<br>1S (45 XP, id=1S_m_elhamribelgoualia_iscdl_be)<br>3CB (145 XP, id=3CB_m_elhamribelgoualia_iscdl_be)<br>3GB (145 XP, id=3GB_m_elhamribelgoualia_iscdl_be)<br>4GT (145 XP, id=4GT_m_elhamribelgoualia_iscdl_be) | **S1-A** | fmttn-1re | 280 XP |
| Francq Oscar | 1A (2580 XP, id=1A_o_francq_iscdl_be)<br>4TTA (2580 XP, id=4TTA_o_francq_iscdl_be) | **S1-A** | fmttn-1re | 2580 XP |
| Hadudi Jumanah | 1S (410 XP, id=1S_j_hadudi_iscdl_be) | **S1-A** | fmttn-1re | 410 XP |
| L Auwarier Robin | 1A (630 XP, id=1A_r_lauwarier_iscdl_be)<br>1S (660 XP, id=1S_r_lauwarier_iscdl_be) | **S1-A** | fmttn-1re | 660 XP |
| Lewille Florent | 1S (1725 XP, id=1S_f_lewille_iscdl_be) | **S1-A** | fmttn-1re | 1725 XP |
| Martinez Valcke Amalia | 4GT (140 XP, id=4GT_a_martinezvalcke_iscdl_be) | **S1-A** | fmttn-1re | 140 XP |
| Oubachir Nayla | 1A (2365 XP, id=1A_n_oubachir_iscdl_be)<br>1S (2365 XP, id=1S_n_oubachir_iscdl_be) | **S1-A** | fmttn-1re | 2365 XP |
| Vancaeyzeele Lucien | 1A (115 XP, id=1A_l_vancaeyzeele_iscdl_be)<br>1S (380 XP, id=1S_l_vancaeyzeele_iscdl_be) | **S1-A** | fmttn-1re | 380 XP |
| Vandenhende Valentine | 1A (650 XP, id=1A_v_vandenhende_iscdl_be)<br>1B (115 XP, id=1B_v_vandenhende_iscdl_be)<br>1S (650 XP, id=1S_v_vandenhende_iscdl_be)<br>3C (115 XP, id=3C_v_vandenhende_iscdl_be) | **S1-A** | fmttn-1re | 650 XP |

## 3. Comptes absents de la liste passés en classe `0`

| Nom / ID | Ancienne classe | Nouvelle classe | XP conservés |
|---|---|---|---|
| Rym Ben Nasr | 1A (115 XP, id=1A_r_bennasr_iscdl_be) | **0** | 115 XP |
| Info Pub | 1B (30 XP, id=1B_infopubinfo8_gmail_com) | **0** | 30 XP |
| Gaëtan Dursin | 1F (30 XP, id=1F_g_dursin_iscdl_be) | **0** | 30 XP |
| Charlotte Hayez | 3A (25 XP, id=3A_c_hayez_iscdl_be) | **0** | 25 XP |
| Eugène Grimonprez | 3A (75 XP, id=3A_e_grimonprez_iscdl_be) | **0** | 75 XP |
| Léo Devrière | 3A (50 XP, id=3A_l_devriere_iscdl_be) | **0** | 50 XP |
| Timeo Maroi | 3A (50 XP, id=3A_ti_maroi_iscdl_be) | **0** | 50 XP |
| Julie Guily | 3B (100 XP, id=3B_j_guily_iscdl_be) | **0** | 100 XP |
| Khadidja Souadji | 3B (85 XP, id=3B_k_souadji_iscdl_be) | **0** | 85 XP |
| Lyloo Delemme | 3B (50 XP, id=3B_l_delemme_iscdl_be) | **0** | 50 XP |
| Marlon Duez | 3B (0 XP, id=3B_m_duez_iscdl_be) | **0** | 0 XP |
| Valentina Guillet | 3B (70 XP, id=3B_v_guillet_iscdl_be) | **0** | 70 XP |
| Laurent Humblet | 3CB (0 XP, id=3CB_l_humblet_iscdl_be) | **0** | 0 XP |
| Marlon Duez | 3CB (0 XP, id=3CB_m_duez_iscdl_be) | **0** | 0 XP |
| Valentina Guillet | 3C (0 XP, id=3C_v_guillet_iscdl_be) | **0** | 0 XP |
| Emilien Mortier | 3GB (50 XP, id=3GB_e_mortier_iscdl_be) | **0** | 50 XP |
| Kenza Selmani | 3GB (95 XP, id=3GB_k_selmani_iscdl_be) | **0** | 95 XP |
| Lilas Hequet | 3GB (25 XP, id=3GB_l_hequet_iscdl_be) | **0** | 25 XP |
| Marlon Duez | 3GB (165 XP, id=3GB_m_duez_iscdl_be) | **0** | 165 XP |
| Timéo Seynaeve | 3GB (0 XP, id=3GB_t_seynaeve_iscdl_be) | **0** | 0 XP |
| Valentina Guillet | 3GB (0 XP, id=3GB_v_guillet_iscdl_be) | **0** | 0 XP |
| Issam Aouina | 3GTB (25 XP, id=3GTB_i_aouina_iscdl_be) | **0** | 25 XP |
| Lyloo Delemme | 3GTB (70 XP, id=3GTB_l_delemme_iscdl_be) | **0** | 70 XP |
| Timéo Seynaeve | 3GTB (125 XP, id=3GTB_t_seynaeve_iscdl_be) | **0** | 125 XP |
| Enes Ouras | 3GTC (50 XP, id=3GTC_e_ouras_iscdl_be) | **0** | 50 XP |
| Anas El Baddouti | 3G (100 XP, id=3G_a_elbaddouti_iscdl_be) | **0** | 100 XP |
| Amine Laksanamixay | 3G (50 XP, id=3G_a_laksanamixay_iscdl_be) | **0** | 50 XP |
| Anouk Kortleven | 3G (50 XP, id=3G_an_kortleven_iscdl_be) | **0** | 50 XP |
| Manon Dujardin | 3G (30 XP, id=3G_m_dujardin_iscdl_be) | **0** | 30 XP |
| Timeo Maroi | 3G (25 XP, id=3G_ti_maroi_iscdl_be) | **0** | 25 XP |
| Aaron Frigard | 4TTA (0 XP, id=4TTA_st_aaron_frigard) | **0** | 0 XP |
| Alexandre Desmet | 4TTA (0 XP, id=4TTA_st_alexandre_desmet) | **0** | 0 XP |
| Arthur Vanassche | 4TTA (0 XP, id=4TTA_st_arthur_vanassche) | **0** | 0 XP |
| Axel Veys | 4TTA (0 XP, id=4TTA_st_axel_veys) | **0** | 0 XP |
| Ayann Akten | 4TTA (0 XP, id=4TTA_st_ayann_akten) | **0** | 0 XP |
| Gabin Delaby | 4TTA (0 XP, id=4TTA_st_gabin_delaby) | **0** | 0 XP |
| Loucas Lombard | 4TTA (0 XP, id=4TTA_st_loucas_lombard) | **0** | 0 XP |
| Mathis Smeulders | 4TTA (0 XP, id=4TTA_st_mathis_smeulders) | **0** | 0 XP |
| Nathan Deschiever | 4TTA (0 XP, id=4TTA_st_nathan_deschiever) | **0** | 0 XP |
| Noah Bricout | 4TTA (0 XP, id=4TTA_st_noah_bricout) | **0** | 0 XP |
| Noah Hustinx | 4TTA (0 XP, id=4TTA_st_noah_hustinx) | **0** | 0 XP |
| Tommy Macarez | 4TTA (0 XP, id=4TTA_st_tommy_macarez) | **0** | 0 XP |
