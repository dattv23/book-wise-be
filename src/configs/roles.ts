import { Role } from '@prisma/client'

const allRoles = {
  [Role.USER]: [],
  [Role.ADMIN]: ['getUsers', 'manageUsers', 'manageBooks', 'manageCategories', 'manageReviews']
}

export const roles = Object.keys(allRoles)
export const roleRights = new Map(Object.entries(allRoles))
