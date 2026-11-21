# Z Tools V4.0.0 — Unified Correction Update

V4 is a correction/hardening pass over V3, not a rebuild.

### Preserved
- Single HTML shell
- Local/offline-first architecture
- IndexedDB persistence/checkpoints
- SPF Google/Cloudflare DoH flow
- SPF retry/pause/resume/export
- rDNS cache/retry/timeout/resume
- Analytics snapshots/history/comparison/export
- Dark and Light themes
- Shared navigation and notifications

### Corrected
- rDNS search/filter event wiring
- rDNS action state transitions
- production DEMO removal
- hard-coded SPF token removal
- empty error swallowing in touched paths
- unified icon language
- global design tokens
- command palette actions
- settings persistence and import/export
- storage controls
- diagnostics
- Analytics validation and neutral trend labels
- keyboard/focus accessibility improvements

### Verification
Static checks are documented in `AUDIT.md`.
Browser runtime click-through remains environment-limited because the test Chromium instance is blocked from loading localhost pages by the execution environment.
