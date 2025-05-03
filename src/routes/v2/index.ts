import express from 'express'

import importRoute from './import.route'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/import',
    route: importRoute
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
