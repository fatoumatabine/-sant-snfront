export const splitFullName = (fullName?: string | null) => {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

export const joinFullName = (firstName?: string | null, lastName?: string | null) =>
  [firstName, lastName]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
