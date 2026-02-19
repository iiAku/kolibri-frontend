---

## Deployment Architecture Constraint (CRITICAL)

Kolibri is currently deployed through a static build pipeline compatible with Cloudflare Workers / static hosting.

Therefore:

- ❌ Do NOT introduce mandatory server-side rendering (SSR).
- ❌ Do NOT require a Node server at runtime.
- ❌ Do NOT introduce backend dependencies for rendering.
- ✅ The final application MUST remain deployable as static assets.

Nuxt must be configured in one of the following modes only:

- Nuxt static generation (`nuxi generate`)
- SPA/static-compatible configuration

The production output must remain compatible with the existing deployment model and CI pipeline.

If Nuxt introduces SSR by default, explicitly disable it.

Goal:
Maintain the same deployment architecture while modernizing developer tooling and maintainability.
