import express from 'express'

import importRoute from './import.route'
import exportRoute from './export.route'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/import',
    route: importRoute
  },
  {
    path: '/export',
    route: exportRoute
  }
]

// const devRoutes = [
//   // routes available only in development mode
//   {
//     path: '/docs',
//     route: docsRoute
//   }
// ]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

/* istanbul ignore next */
// if (config.env === 'development') {
//   devRoutes.forEach((route) => {
//     router.use(route.path, route.route)
//   })
// }

export default router
