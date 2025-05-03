import { Role } from '@prisma/client'

const allRoles = {
  [Role.USER]: [],
  [Role.ADMIN]: ['mngUser', 'mngProduct', 'mngCategory', 'mngReview', 'mngOrder', 'mngImport']
}

export const roles = Object.keys(allRoles)
export const roleRights = new Map(Object.entries(allRoles))
