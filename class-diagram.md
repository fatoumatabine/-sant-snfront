# Diagramme de Classes - SantSN

```mermaid
classDiagram
    %% Enums
    class Role {
        <<enumeration>>
        PATIENT
        MEDECIN
        SECRETAIRE
        ADMIN
    }

    class StatutRendezVous {
        <<enumeration>>
        EN_ATTENTE
        CONFIRME
        TERMINE
        ANNULE
        PAYE
    }

    class TypeRendezVous {
        <<enumeration>>
        EN_LIGNE
        PRESENTIEL
        PRESTATION
    }

    class StatutConsultation {
        <<enumeration>>
        EN_ATTENTE
        EN_COURS
        TERMINE
    }

    class StatutPaiement {
        <<enumeration>>
        EN_ATTENTE
        PAYE
        ECHOUE
        REMBOURSE
    }

    class StatutPrestation {
        <<enumeration>>
        EN_ATTENTE
        EN_COURS
        TERMINE
    }

    %% Classes Utilisateurs
    class User {
        <<abstract>>
        +Long id
        +String email
        +String password
        +String name
        +Role role
        +DateTime emailVerifiedAt
        +Boolean isArchived
        +DateTime createdAt
        +DateTime updatedAt
        +login() void
        +logout() void
        +updateProfile() void
    }

    class Patient {
        +String nom
        +String prenom
        +String telephone
        +DateTime date_naissance
        +String adresse
        +String groupe_sanguin
        +Boolean diabete
        +Boolean hypertension
        +Boolean hepatite
        +String autres_pathologies
        +bookAppointment() void
        +viewHistory() void
        +makePayment() void
    }

    class Medecin {
        +String nom
        +String prenom
        +String specialite
        +String telephone
        +String adresse
        +Float tarif_consultation
        +consultPatient() void
        +prescribeMedicine() void
        +manageSlots() void
        +viewAppointments() void
    }

    class Secretaire {
        +String nom
        +String prenom
        +String telephone
        +Long medecinId
        +confirmAppointment() void
        +manageSchedule() void
        +processPayment() void
    }

    class Admin {
        +List~String~ permissions
        +manageSystem() void
        +configureSettings() void
    }

    %% Classes Entités Métier
    class RendezVous {
        +String numero
        +DateTime date
        +String heure
        +TypeRendezVous type
        +StatutRendezVous statut
        +Boolean urgent_ia
        +String motif
        +String raison_refus
        +String prestation_type
        +book() void
        +confirm() void
        +cancel() void
        +updateStatus() void
    }

    class Consultation {
        +DateTime date
        +String heure
        +String type
        +StatutConsultation statut
        +Json constantes
        +String diagnostic
        +String observations
        +start() void
        +finish() void
        +recordConstantes() void
    }

    class Ordonnance {
        +String contenu
        +DateTime date_creation
        +Integer validiteJours
        +addMedicine() void
        +save() void
    }

    class Paiement {
        +Float montant
        +String methode
        +StatutPaiement statut
        +String transactionId
        +DateTime date_paiement
        +initiate() void
        +confirm() void
        +fail() void
        +refund() void
    }

    class Prestation {
        +String type
        +StatutPrestation statut
        +String resultat
        +DateTime date_realisation
        +request() void
        +perform() void
        +completeService() void
    }

    %% Classes Support
    class Medicament {
        +String nom
        +String forme
        +String dosage
        +getMedicamentInfo() Json
    }

    class CreneauDisponible {
        +Integer jour
        +String heure
        +Boolean actif
        +addSlot() void
        +removeSlot() void
        +updateStatus() void
    }

    class Notification {
        +String titre
        +String message
        +Boolean lu
        +send() void
        +markAsRead() void
    }

    class ChatThread {
        +DateTime lastMessageAt
        +createThread() void
        +getMessages() List~ChatMessage~
    }

    class ChatMessage {
        +String content
        +DateTime readAt
        +sendMessage() void
        +markAsRead() void
    }

    class PatientTriageEvaluation {
        +Json responses
        +String niveau
        +Boolean urgent
        +String specialiteConseillee
        +Json recommandations
        +evaluate() void
        +getRecommendations() Json
    }

    %% Classes Système
    class RendezVousTransitionLog {
        +StatutRendezVous fromStatut
        +StatutRendezVous toStatut
        +Role actorRole
        +Long actorUserId
        +String reason
        +Json metadata
        +logTransition() void
    }

    class ConsultationPresence {
        +Role role
        +Long userId
        +DateTime lastSeenAt
        +recordPresence() void
    }

    class AppSetting {
        +String key
        +Json value
        +getSetting() Json
        +setSetting() void
    }

    class UserSetting {
        +Json value
        +updateSetting() void
    }

    %% Relations d'héritage
    User <|-- Patient
    User <|-- Medecin
    User <|-- Secretaire
    User <|-- Admin

    %% Relations principales
    User ||--o{ RendezVous : "crée"
    User ||--o{ Consultation : "participe"
    User ||--o{ Notification : "reçoit"
    User ||--o{ ChatMessage : "envoie"
    User ||--o{ ChatThread : "participe"

    Patient ||--o{ RendezVous : "prend"
    Patient ||--o{ Consultation : "subit"
    Patient ||--o{ Paiement : "effectue"
    Patient ||--o{ Prestation : "demande"
    Patient ||--o{ Ordonnance : "reçoit"
    Patient ||--o{ PatientTriageEvaluation : "a"

    Medecin ||--o{ RendezVous : "reçoit"
    Medecin ||--o{ Consultation : "conduit"
    Medecin ||--o{ Ordonnance : "prescrit"
    Medecin ||--o{ CreneauDisponible : "gère"
    Medecin ||--|| Secretaire : "emploie"

    Secretaire ||--o{ RendezVous : "gère"

    RendezVous ||--o{ Consultation : "génère"
    RendezVous ||--o{ Paiement : "nécessite"
    RendezVous ||--o{ RendezVousTransitionLog : "enregistre"

    Consultation ||--o{ Ordonnance : "crée"
    Consultation ||--o{ ConsultationPresence : "traque"
    Consultation ||--o{ Prestation : "inclut"

    Ordonnance }o--o{ Medicament : "contient"

    Prestation ||--o{ Consultation : "appartient_à"

    ChatThread ||--o{ ChatMessage : "contient"
    ChatMessage ||--|| User : "depuis"

    PatientTriageEvaluation ||--|| Patient : "évalue"

    User ||--|| UserSetting : "a_paramètres"
    AppSetting ||--o{ User : "s'applique_à"
```

## Description du Système

### Architecture par Couches

**1. Couche Utilisateurs**
- **User** : Classe abstraite de base pour tous les utilisateurs du système
- **Patient** : Représente les patients avec leurs informations médicales
- **Medecin** : Médecins avec spécialité et gestion des créneaux
- **Secretaire** : Personnel administratif assistant les médecins
- **Admin** : Administrateurs système avec gestion des permissions

**2. Couche Métier**
- **RendezVous** : Gestion des rendez-vous en ligne et présentiels
- **Consultation** : Représente les consultations médicales
- **Ordonnance** : Ordonnances électroniques avec médicaments
- **Paiement** : Traitement des paiements et transactions
- **Prestation** : Services médicaux spécifiques

**3. Couche Support**
- **Medicament** : Base de données des médicaments
- **CreneauDisponible** : Gestion des disponibilités des médecins
- **Notification** : Système de notifications internes
- **ChatThread/ChatMessage** : Messagerie interne
- **PatientTriageEvaluation** : Évaluation triage IA

**4. Couche Système**
- **RendezVousTransitionLog** : Journal des transitions d'état
- **ConsultationPresence** : Suivi de présence en consultation
- **AppSetting/UserSetting** : Configuration système et utilisateur

### Relations Clés

- **Héritage** : Tous les types d'utilisateurs héritent de User
- **Composition** : Ordonnance contient plusieurs Médicaments
- **Association** : Patient prend des RendezVous, Medecin conduit des Consultations
- **État** : Les entités ont des cycles de vie avec différents statuts
- **Audit** : Les transitions d'état sont enregistrées pour traçabilité

Ce diagramme illustre l'architecture complète d'un système de gestion de santé moderne avec prise de rendez-vous, consultations, ordonnances électroniques, et paiements intégrés.