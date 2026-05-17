# IranAPI Cyber Vault Design System

## Tokens

- Backgrounds: deep black `#071014`, graphite panels, muted grid overlays.
- Accents: neon cyan for primary action, toxic green for success/security, magenta for priority, amber for warnings, rose for destructive states.
- Radius: default UI/cards use `8px` or less; circular controls remain only where native controls require them.
- Typography: `Vazirmatn` for Persian UI, cyber display fallback stack through `--font-cyber`.

## Components

- API cards: use `.surface-card`, category badge, `ApiStatusBadge`, method badges, price/rating metric grid, and a single primary action.
- API method badges: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` are monospace, high contrast, and color-coded.
- API health/auth chips: pair `HealthSignalBadge` with `AuthSchemeBadge` on catalog cards and detail pages so users can scan availability and credential model quickly.
- Secret previews: use `SecretPreview`; hide even masked previews until the user intentionally reveals them, and never render raw API keys in metadata, cards, or public pages.
- Empty states: use `.empty-state`; copy should be short, useful, and API-contextual.
- Backend/DRF pages: use `api/static/api/cyberpunk-browsable.css` with noindex metadata and no secret examples.

## Motion

- Use opacity/transform transitions only for cards, route fallback, boot, cursor, and scanline effects.
- Respect `prefers-reduced-motion`.
- Avoid decorative blur orbs; prefer grid/scan overlays that are cheaper and easier to read.
- Playful messages are allowed in loading/empty states, but must stay professional and API-related.

## Accessibility

- Keep visible focus states.
- Preserve semantic headings and labels.
- Private/dashboard pages use `noindex`.
- Touch targets should stay at least `44px`.
- Custom cursor must be disabled on coarse pointers and reduced-motion.

## Security

- Account/auth/API-key surfaces use no-store cache headers.
- Logs and API error envelopes pass through secret redaction before returning or writing sensitive values.
- Public/user API throttles are controlled by `API_ANON_THROTTLE_RATE` and `API_USER_THROTTLE_RATE`.
- Examples must use placeholders like `<IRANAPI_API_KEY>`.
- DRF/OpenAPI docs describe secret handling without exposing live credentials.
