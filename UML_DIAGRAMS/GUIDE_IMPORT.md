# GUIDE - Importer les Diagrammes UML dans StarUML

## Fichiers Créés

Tous les diagrammes UML du système **SANTE_SN** ont été créés au format **PlantUML** :

1. ✅ **00-ACTOR_SYMBOL.puml** - Symbole UML (Acteur)
2. ✅ **01-USE_CASES.puml** - Diagramme de Cas d'Usage (global)
3. ✅ **02-CLASS_DIAGRAM.puml** - Diagramme de Classes
4. ✅ **03-ACTIVITY_DIAGRAM.puml** - Diagramme d'Activités
5. ✅ **04-SEQUENCE_DIAGRAM.puml** - Diagramme de Séquence (scénario principal complet)
6. ✅ **05-ARCHITECTURE_DIAGRAM.puml** - Architecture Générale
7. ✅ **06-STATE_RDV.puml** - Machine d'états (Rendez-vous)
8. ✅ **07-STATE_PAIEMENT.puml** - Machine d'états (Paiement)
9. ✅ **08-STATE_CONSULTATION.puml** - Machine d'états (Consultation)
10. ✅ **09-SEQUENCE_VIDEO_CALL.puml** - Séquence (Appel vidéo via Jitsi)
11. ✅ **10-USE_CASES_PATIENT.puml** - Cas d'usage (Patient)
12. ✅ **11-USE_CASES_SECRETAIRE.puml** - Cas d'usage (Secretaire)
13. ✅ **12-USE_CASES_MEDECIN.puml** - Cas d'usage (Medecin)
14. ✅ **13-USE_CASES_ADMIN.puml** - Cas d'usage (Admin)
15. ✅ **14-SEQUENCE_AUTHENTIFICATION.puml** - Séquence (Authentification)
16. ✅ **15-SEQUENCE_DEMANDE_RDV.puml** - Séquence (Demande & validation RDV)
17. ✅ **16-SEQUENCE_PAIEMENT_RDV.puml** - Séquence (Paiement RDV - PayDunya)
18. ✅ **17-CLASS_GLOBAL_SIMPLE_API.puml** - Diagramme global simple (API)
19. ✅ **18-CLASS_GLOBAL_FRONT_API_SIMPLE.puml** - Diagramme global simple (Front + API)
20. ✅ **19-CLASS_DIAGRAM_COMPLET_PROJET.puml** - Diagramme de classes complet du projet

Localisation : `/home/syllafall/Documents/soutenance/UML_DIAGRAMS/`

---

## Méthode 1 : Importer dans StarUML (Recommandé)

### Étape 1 : Installer l'extension PlantUML
1. Ouvrir StarUML
2. Aller à **File → Import** ou **File → Extensions**
3. Chercher et installer l'extension **PlantUML Importer**

### Étape 2 : Importer les fichiers
1. Menu **File → Import → PlantUML**
2. Sélectionner les fichiers `.puml` un par un
3. Valider l'import

Les diagrammes seront créés automatiquement dans StarUML avec :
- ✅ Toutes les classes et relations
- ✅ Les énumérations
- ✅ Les associations (1-to-1, 1-to-*, etc.)

---

## Captures / Exports (pour mémoire)

Dans StarUML, préfère **l’export** plutôt qu’une capture écran (meilleure qualité).

1. Ouvrir le diagramme
2. **File → Export Diagram…**
3. Choisir:
   - **SVG** (recommandé) pour une qualité parfaite (vectoriel)
   - ou **PNG** si ton document final est Word/Google Docs
4. Enregistrer dans: `UML_DIAGRAMS/exports/`

Astuce qualité:
- Si tu exportes en PNG, utilise un scale (2x/3x) si StarUML le propose.

---

## Méthode 2 : Utiliser PlantUML Online

Si StarUML n'a pas l'extension :

1. **En ligne** : https://www.planttext.com/
   - Copier-coller le contenu du fichier `.puml`
   - Cliquer sur **Display**
   - Exporter en PNG/SVG
   - Importer l'image dans StarUML

2. **Localement avec VS Code** :
   - Installer l'extension **PlantUML** (jgraph.drawio ou PlantUML)
   - Ouvrir les fichiers `.puml` dans VS Code
   - Clic droit → **Show Preview** ou **Export**

---

## Méthode 3 : Conversion avec cli

```bash
# Installer PlantUML CLI
sudo apt-get install plantuml

# Convertir en PNG
plantuml 01-USE_CASES.puml -o ../output

# Ou en SVG
plantuml 01-USE_CASES.puml -tsvg -o ../output
```

Puis importer les PNG/SVG dans StarUML.

---

## Contenu de chaque Diagramme

### 📊 **Diagramme de Cas d'Usage** (01-USE_CASES.puml)
- **Acteurs** : Patient, Médecin, Secrétaire, Admin, Système IA
- **Cas d'usage principaux** :
  - Authentification (Login, Register, Recovery)
  - Gestion RendezVous (Book, Confirm, Cancel, Manage Slots)
  - Consultation (Consult, Prescribe, Diagnose)
  - Paiements (Pay, Track)
  - Triage IA (Evaluate, Recommend)
  - Prestations (Request, Perform, View Results)
  - Chat (Send/Receive messages)
  - Administration (Manage Users, Settings, Stats)

Diagrammes par acteur (pratiques pour ton memoire) :
- `10-USE_CASES_PATIENT.puml`
- `11-USE_CASES_SECRETAIRE.puml`
- `12-USE_CASES_MEDECIN.puml`
- `13-USE_CASES_ADMIN.puml`

### 🏗️ **Diagramme de Classes** (02-CLASS_DIAGRAM.puml)
- **17 Entités principales** :
  - User (base)
  - Patient, Medecin, Secretaire, Admin (rôles)
  - RendezVous, Consultation, Ordonnance
  - Paiement, Prestation
  - ChatThread, ChatMessage
  - Et bien d'autres...
- **Énumérations** : Role, StatutRendezVous, TypeRendezVous, StatutConsultation, StatutPaiement, StatutPrestation
- **Associations** : 1-to-1, 1-to-*, *-to-*

Version detaillee et a jour avec tout le schema Prisma :
- `19-CLASS_DIAGRAM_COMPLET_PROJET.puml`

### 🔄 **Diagramme d'Activités** (03-ACTIVITY_DIAGRAM.puml)
**Flux complet** : Prise de RDV → Confirmation → Paiement → Consultation → Prestation → Archivage
- Décision : Urgent ? Dispo ? Paiement OK ?
- Branches conditionnelles avec alternatives

### 📱 **Diagramme de Séquence** (04-SEQUENCE_DIAGRAM.puml)
**Scénario détaillé** : Patient prend RDV jusqu'à consultation complète
8 phases :
1. Authentification
2. Triage IA
3. Prise de RDV
4. Confirmation secrétaire
5. Paiement
6. Consultation médicale
7. Prescription
8. Archivage

**Interactions** : Patient ↔ Frontend ↔ API ↔ Services ↔ Database

Séquences séparées (plus simples pour ton mémoire) :
- `14-SEQUENCE_AUTHENTIFICATION.puml`
- `15-SEQUENCE_DEMANDE_RDV.puml`
- `16-SEQUENCE_PAIEMENT_RDV.puml`

### 🏛️ **Architecture Générale** (05-ARCHITECTURE_DIAGRAM.puml)
**Stack technique** :
- **Frontend** : React (Web) + WeChat Mini Program
- **API** : Node.js Express + Gateway
- **Services** : Patient, Médecin, RDV, Consultation, Paiement, etc.
- **AI** : Triage IA + Patient Evaluation
- **Infrastructure** : Redis, PostgreSQL, S3, Queue (Bull/RabbitMQ)
- **Externes** : SMS, Email, Payment Gateway
- **Monitoring** : Winston, ELK, Prometheus

### 🔁 **Machines d'états** (06/07/08)
- **06-STATE_RDV.puml** : transitions `en_attente → confirme → paye → termine` + `annule`.
- **07-STATE_PAIEMENT.puml** : `en_attente → paye/echoue`, retry, et `rembourse` (optionnel).
- **08-STATE_CONSULTATION.puml** : `en_attente → en_cours → termine`.

### 🎥 **Séquence Appel Vidéo** (09-SEQUENCE_VIDEO_CALL.puml)
- Flux “médecin démarre” puis “patient rejoint” via `joinUrl` (Jitsi).
- Polling présence: `ping` + `presence` toutes les 5 secondes.

---

## 🎨 Personnalisation dans StarUML

Après import, vous pouvez :
1. **Changer les couleurs** : Format → Properties
2. **Ajouter des stéréotypes** : Double-click → Add Stereotype
3. **Améliorer la mise en page** : Diagram → Auto Layout
4. **Ajouter des constraints** : Double-click → Add Constraint
5. **Exporter** : File → Export

---

## 📋 Prochaines Étapes

1. ✅ Importer les 5 diagrammes dans StarUML
2. 🔄 Affiner les diagrammes selon votre feedback
3. 📸 Générer des exports (PNG/SVG/PDF)
4. 📝 Ajouter les diagrammes au mémoire

---

## 💡 Astuce

Pour une meilleure importation :
- **StarUML Pro** dispose d'une meilleure intégration PlantUML
- Si problème : exporter d'abord en SVG, puis importer comme image
- Garder les fichiers `.puml` pour la traçabilité et futures modifications

---

**Créé le** : 10 Mars 2026  
**Système** : SANTE_SN - Plateforme de Gestion Sanitaire  
**Format** : PlantUML (Compatible StarUML, DrawIO, PlantUML CLI)
