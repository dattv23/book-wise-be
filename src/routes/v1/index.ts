import express from 'express'

import userRoute from './user.route'
import authRoute from './auth.route'
import categoryRoute from './category.route'
import bookRoute from './book.route'
import reviewRoute from './review.route'

const router = express.Router()

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/books',
    route: bookRoute
  },
  {
    path: '/categories',
    route: categoryRoute
  },
  {
    path: '/reviews',
    route: reviewRoute
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
