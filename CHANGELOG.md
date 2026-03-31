# Changelog

## 2026-03-31

### Fixed
- Login-Name (E-Mail) wird vor dem Senden an das Backend mit `.trim().toLowerCase()` normalisiert, sodass Groß-/Kleinschreibung beim Login keine Rolle mehr spielt. Betrifft Login, Registrierung und Vereinserstellung in `LoginView.vue` und `RegisterView.vue`.
