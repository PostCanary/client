// src/types/router.d.ts
import 'vue-router'
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    requiresPro?: boolean
    marketing?: boolean   // <- used to hide sidebar
  }
}