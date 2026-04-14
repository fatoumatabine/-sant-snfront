import { QuestionIA } from '@/types';

export const questionsEvaluationIA: QuestionIA[] = [
  {
    id: 'q1',
    question: 'Quel est votre principal symptôme ou motif de consultation ?',
    type: 'choice',
    options: [
      'Douleur',
      'Fièvre',
      'Fatigue',
      'Problèmes respiratoires',
      'Problèmes digestifs',
      'Problèmes de peau',
      'Autre',
    ],
  },
  {
    id: 'q2',
    question: 'Depuis combien de temps ressentez-vous ces symptômes ?',
    type: 'choice',
    options: ['Moins de 24 heures', '1 à 3 jours', '1 semaine', '2 à 4 semaines', "Plus d'un mois"],
  },
  {
    id: 'q3',
    question: "Sur une échelle de 1 à 10, comment évaluez-vous l'intensité de vos symptômes ?",
    type: 'scale',
  },
  {
    id: 'q4',
    question: 'Avez-vous des antécédents médicaux importants ?',
    type: 'multiple',
    options: [
      'Diabète',
      'Hypertension',
      'Maladies cardiaques',
      'Asthme ou allergies',
      'Maladies chroniques',
      'Aucun antécédent',
    ],
  },
  {
    id: 'q5',
    question: 'Prenez-vous actuellement des médicaments ?',
    type: 'choice',
    options: ['Oui', 'Non'],
  },
  {
    id: 'q6',
    question: 'Si oui, lesquels ? (Sinon, laissez vide)',
    type: 'text',
  },
  {
    id: 'q7',
    question: 'Avez-vous de la fièvre actuellement ?',
    type: 'choice',
    options: ['Non, pas de fièvre', 'Légère (37.5 - 38°C)', 'Modérée (38 - 39°C)', 'Élevée (> 39°C)', 'Je ne sais pas'],
  },
  {
    id: 'q8',
    question: "Y a-t-il d'autres symptômes associés ?",
    type: 'multiple',
    options: ['Maux de tête', 'Nausées ou vomissements', 'Diarrhée', 'Toux', 'Douleurs musculaires', "Perte d'appétit", 'Aucun autre symptôme'],
  },
];

export const generateRecommandation = (reponses: Record<string, string | string[]>) => {
  const symptomePrincipal = reponses.q1 as string;
  const intensite = parseInt((reponses.q3 as string) || '5', 10) || 5;
  const fievre = reponses.q7 as string;

  let niveau: 'faible' | 'modere' | 'eleve' = 'faible';
  let specialiteConseillee = 'Médecine Générale';
  const recommandations: string[] = [];

  if (intensite >= 8 || fievre?.includes('Élevée')) {
    niveau = 'eleve';
    recommandations.push('Consultez un médecin rapidement');
  } else if (intensite >= 5 || fievre?.includes('Modérée')) {
    niveau = 'modere';
    recommandations.push('Une consultation dans les 24-48h est recommandée');
  } else {
    recommandations.push('Surveillance à domicile recommandée');
  }

  switch (symptomePrincipal) {
    case 'Douleur':
      recommandations.push('Notez la localisation exacte de la douleur pour le médecin');
      recommandations.push("Évitez l'automédication excessive");
      break;
    case 'Fièvre':
      recommandations.push('Hydratez-vous régulièrement');
      recommandations.push('Prenez du paracétamol si nécessaire');
      break;
    case 'Problèmes respiratoires':
      specialiteConseillee = 'Pneumologie';
      recommandations.push('Évitez les environnements enfumés');
      if (intensite >= 7) {
        niveau = 'eleve';
        recommandations.unshift('Consultation urgente recommandée');
      }
      break;
    case 'Problèmes digestifs':
      recommandations.push('Adoptez une alimentation légère');
      recommandations.push('Restez bien hydraté');
      break;
    case 'Problèmes de peau':
      specialiteConseillee = 'Dermatologie';
      recommandations.push('Évitez de gratter ou toucher les zones affectées');
      break;
    case 'Fatigue':
      recommandations.push('Assurez-vous de dormir suffisamment');
      recommandations.push('Un bilan sanguin peut être utile');
      break;
    default:
      recommandations.push('Décrivez précisément vos symptômes au médecin');
  }

  recommandations.push("Apportez vos ordonnances et résultats d'analyses récents");

  return {
    niveau,
    recommandations,
    specialiteConseillee,
  };
};
