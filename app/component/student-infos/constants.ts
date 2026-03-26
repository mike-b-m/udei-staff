/**
 * Application-wide constants for staff roles and faculties
 * Centralized to avoid string duplication and typos
 */

export const STAFF_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  ADMINISTRATION: 'administration',
  PROFESSOR: 'prof'
} as const

export const ADMIN_ROLES = [
  STAFF_ROLES.ADMIN,
  STAFF_ROLES.ADMINISTRATION
] as const

export const EDITOR_ROLES = [
  STAFF_ROLES.ADMIN,
  STAFF_ROLES.ADMINISTRATION,
  STAFF_ROLES.EDITOR
] as const

export const FACULTIES = [
  'Génie Civil',
  'Médecine Générale',
  'Odontologie',
  'Sciences Infirmières',
  'Sciences Administratives',
  'Sciences Comptables',
  'Gestion des affaires',
  'Sciences Agronomiques',
  'Sciences Economiques',
  'Sciences de l\'Education',
  'Sciences Juridiques',
  'Science Informatique',
  'Pharmacologies',
  'Médecine vétérinaire',
  'Laboratoire Médicale',
  'Physiothérapie',
  'Jardinières d\'enfants'
] as const
