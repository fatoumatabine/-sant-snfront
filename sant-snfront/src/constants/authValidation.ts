export const GMAIL_EMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;

export const AUTH_MIN_LENGTHS = {
  name: 2,
  password: 8,
  telephone: 8,
} as const;

export const AUTH_VALIDATION_MESSAGES = {
  gmail: "Email invalide. Utilisez uniquement le format votrenom@gmail.com",
  password: `Le mot de passe doit contenir au moins ${AUTH_MIN_LENGTHS.password} caractères`,
  prenom: `Le prénom doit contenir au moins ${AUTH_MIN_LENGTHS.name} caractères`,
  nom: `Le nom doit contenir au moins ${AUTH_MIN_LENGTHS.name} caractères`,
  telephone: "Le numéro de téléphone est requis",
} as const;

export const isValidGmailEmail = (value: string): boolean =>
  GMAIL_EMAIL_REGEX.test(value.trim());
