import { UserRole } from '@/types';

const ACCEPTED_AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_AVATAR_FILE_SIZE = 1024 * 1024;

export const isImportedAvatar = (value?: string | null): boolean =>
  typeof value === 'string' && value.trim().startsWith('data:image/');

export const getAvatarSrc = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getUserInitials = (prenom?: string | null, nom?: string | null, email?: string | null): string => {
  const first = prenom?.trim()?.[0] || '';
  const last = nom?.trim()?.[0] || '';

  if (first || last) {
    return `${first}${last}`.toUpperCase() || '?';
  }

  return (email?.trim()?.[0] || '?').toUpperCase();
};

export const getRoleLabel = (role?: UserRole | string | null): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'medecin':
      return 'Medecin';
    case 'secretaire':
      return 'Secretaire';
    case 'patient':
    default:
      return 'Patient';
  }
};

export const fileToAvatarDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!ACCEPTED_AVATAR_MIME_TYPES.includes(file.type)) {
      reject(new Error('Formats acceptes: PNG, JPG, WEBP ou GIF.'));
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      reject(new Error('La photo ne doit pas depasser 1 Mo.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        reject(new Error("Impossible de lire l'image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Impossible de lire l'image."));
    reader.readAsDataURL(file);
  });
