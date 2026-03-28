/**
 * Utilitaires de validation pour le frontend
 * Ces validations doivent correspondre à celles du backend
 */

import { useState } from 'react';

// Préfixes de téléphone sénégalais valides
const SENEGAL_PHONE_PREFIXES = ['70', '71', '76', '77', '78', '75', '33'];
const GMAIL_EMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;

/**
 * Valide un numéro de téléphone sénégalais
 * @param phone - Numéro de téléphone à valider
 * @returns true si le numéro est valide
 */
export const validateSenegalPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Supprimer tous les espaces
  const cleaned = phone.replace(/\s/g, '');
  
  // Regex pour numéro sénégalais
  // +221 + 9 chiffres (70, 71, 76, 77, 78, 75, 33 + 7 chiffres)
  const senegalPhoneRegex = /^(\+221|221)?(70|71|76|77|78|75|33)\d{7}$/;
  
  return senegalPhoneRegex.test(cleaned);
};

/**
 * Formate un numéro de téléphone sénégalais
 * @param phone - Numéro de téléphone à formater
 * @returns Numéro formaté avec +221
 */
export const formatSenegalPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Supprimer tous les espaces et caractères non numériques (sauf +)
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si ça commence par +, garder le format +221
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Si ça commence par 221, ajouter +
  if (cleaned.startsWith('221')) {
    return '+' + cleaned;
  }
  
  // Si ça commence par un préfixe valide (70, 71, 76, 77, 78)
  if (/^(70|71|76|77|78|75|33)/.test(cleaned)) {
    return '+221' + cleaned;
  }
  
  return phone;
};

/**
 * Valide une adresse email
 * @param email - Email à valider
 * @returns true si l'email est valide
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  return GMAIL_EMAIL_REGEX.test(email.trim());
};

/**
 * Valide un mot de passe
 * @param password - Mot de passe à valider
 * @returns true si le mot de passe est valide
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (!password) {
    return { valid: false, message: 'Le mot de passe est requis' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' };
  }
  return { valid: true, message: '' };
};

/**
 * Messages d'erreur pour la validation
 */
export const ValidationMessages = {
  required: 'Ce champ est obligatoire',
  invalidEmail: 'Adresse email invalide. Utilisez uniquement le format votrenom@gmail.com',
  invalidPhone: 'Téléphone invalide. Utilisez un numéro sénégalais (+221) avec les préfixes 70, 71, 76, 77, 78, 75 ou 33',
  invalidPassword: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
  phoneAlreadyUsed: 'Ce numéro de téléphone est déjà utilisé',
  emailAlreadyUsed: 'Cet email est déjà utilisé',
  minLength: (min: number) => `Ce champ doit contenir au moins ${min} caractères`,
};

/**
 * Interface pour les résultats de validation
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valide les données d'un formulaire de création de médecin
 */
export const validateMedecinForm = (data: {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  password?: string;
  specialite?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validation du prénom
  if (!data.prenom || data.prenom.trim().length < 2) {
    errors.push({ field: 'prenom', message: 'Le prénom doit contenir au moins 2 caractères' });
  }
  
  // Validation du nom
  if (!data.nom || data.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom doit contenir au moins 2 caractères' });
  }
  
  // Validation de l'email
  if (!data.email) {
    errors.push({ field: 'email', message: ValidationMessages.required });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: ValidationMessages.invalidEmail });
  }
  
  // Validation du téléphone
  if (!data.telephone) {
    errors.push({ field: 'telephone', message: ValidationMessages.required });
  } else if (!validateSenegalPhoneNumber(data.telephone)) {
    errors.push({ field: 'telephone', message: ValidationMessages.invalidPhone });
  }
  
  // Validation de la spécialite
  if (!data.specialite) {
    errors.push({ field: 'specialite', message: ValidationMessages.required });
  }
  
  // Validation du mot de passe
  if (!data.password) {
    errors.push({ field: 'password', message: ValidationMessages.required });
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valide les données d'un formulaire de création de secrétaire
 */
export const validateSecretaireForm = (data: {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  password?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validation du prénom
  if (!data.prenom || data.prenom.trim().length < 2) {
    errors.push({ field: 'prenom', message: 'Le prénom doit contenir au moins 2 caractères' });
  }
  
  // Validation du nom
  if (!data.nom || data.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom doit contenir au moins 2 caractères' });
  }
  
  // Validation de l'email
  if (!data.email) {
    errors.push({ field: 'email', message: ValidationMessages.required });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: ValidationMessages.invalidEmail });
  }
  
  // Validation du téléphone
  if (!data.telephone) {
    errors.push({ field: 'telephone', message: ValidationMessages.required });
  } else if (!validateSenegalPhoneNumber(data.telephone)) {
    errors.push({ field: 'telephone', message: ValidationMessages.invalidPhone });
  }
  
  // Validation du mot de passe
  if (!data.password) {
    errors.push({ field: 'password', message: ValidationMessages.required });
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valide les données d'un formulaire de création de patient
 */
export const validatePatientForm = (data: {
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  password?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Validation du prénom
  if (!data.prenom || data.prenom.trim().length < 2) {
    errors.push({ field: 'prenom', message: 'Le prénom doit contenir au moins 2 caractères' });
  }
  
  // Validation du nom
  if (!data.nom || data.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom doit contenir au moins 2 caractères' });
  }
  
  // Validation de l'email
  if (!data.email) {
    errors.push({ field: 'email', message: ValidationMessages.required });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: ValidationMessages.invalidEmail });
  }
  
  // Validation du téléphone
  if (!data.telephone) {
    errors.push({ field: 'telephone', message: ValidationMessages.required });
  } else if (!validateSenegalPhoneNumber(data.telephone)) {
    errors.push({ field: 'telephone', message: ValidationMessages.invalidPhone });
  }
  
  // Validation du mot de passe
  if (!data.password) {
    errors.push({ field: 'password', message: ValidationMessages.required });
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obtient le premier champ invalide pour affichage (pour afficher un seul message à la fois)
 */
export const getFirstError = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  // Prioriser les champs par ordre d'importance
  const priorityFields = ['telephone', 'email', 'password', 'specialite', 'nom', 'prenom'];
  
  const sortedErrors = [...errors].sort((a, b) => {
    const aIndex = priorityFields.indexOf(a.field);
    const bIndex = priorityFields.indexOf(b.field);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
  
  return sortedErrors[0].message;
};

/**
 * Hook pour gérer l'état de validation d'un champ
 */
export const useFieldValidation = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  
  const validate = (validationFn: (value: string) => boolean, errorMessage: string) => {
    if (touched) {
      setError(validationFn(value) ? '' : errorMessage);
    }
  };
  
  const onChange = (newValue: string) => {
    setValue(newValue);
    if (touched) {
      setError('');
    }
  };
  
  const onBlur = () => {
    setTouched(true);
  };
  
  return {
    value,
    error,
    touched,
    setError,
    validate,
    onChange,
    onBlur,
    setValue,
    setTouched
  };
};
