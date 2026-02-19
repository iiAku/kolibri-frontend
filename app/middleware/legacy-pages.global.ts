import { LEGACY_PAGES_DISABLED } from '~/utils/constants'

const legacyRoutes = ['/liquidity-pool', '/savings-rate', '/farming']

export default defineNuxtRouteMiddleware((to) => {
  if (LEGACY_PAGES_DISABLED && legacyRoutes.includes(to.path)) {
    return navigateTo('/', { redirectCode: 302 })
  }
})
