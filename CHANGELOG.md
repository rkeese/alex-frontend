# Changelog

## 2026-04-02

### Added
- **PDF-Vorschau in Dokumentenverwaltung**: PDF-Dokumente können direkt im Browser in einem maximierbaren Dialog angezeigt werden, ohne sie herunterladen zu müssen. Ein Augen-Icon (👁) erscheint in der Aktionen-Spalte bei allen `.pdf`-Dateien.
- Neue API-Methode `getDocumentBlobUrl()` zum Laden von Dokumenten als Blob-URL für die Inline-Anzeige.

## 2026-04-01

### Added
- **Brute-Force-Schutz im Login**: Bei HTTP 429 (Account temporär gesperrt oder Rate Limit) wird ein Countdown-Timer angezeigt und der Login-Button für die Dauer der Sperre deaktiviert.
- **Gesperrt-Meldung (HTTP 403)**: Wenn ein Konto von einem Administrator gesperrt wurde, erscheint eine spezifische Fehlermeldung.
- **Login-Status in Benutzerverwaltung**: Neue Spalte zeigt Fehlversuche (`failed_login_attempts`) und aktive Brute-Force-Sperren (`locked_until`) an.
- **ApiError-Klasse** in `api.ts`: Fehler aus API-Aufrufen enthalten jetzt den HTTP-Status und den `Retry-After`-Header.

### Changed
- `User`-Interface um `failed_login_attempts` und `locked_until` erweitert.
- Beim Entsperren eines Benutzers wird der Lockout-Status in der UI sofort zurückgesetzt (Backend setzt `failed_login_attempts` und `locked_until` automatisch zurück).

## 2026-03-31

### Fixed
- Login-Name (E-Mail) wird vor dem Senden an das Backend mit `.trim().toLowerCase()` normalisiert, sodass Groß-/Kleinschreibung beim Login keine Rolle mehr spielt. Betrifft Login, Registrierung und Vereinserstellung in `LoginView.vue` und `RegisterView.vue`.
