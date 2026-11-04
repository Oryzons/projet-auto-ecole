# Supprime les anciens fichiers du site admin (avant la reprise de Nautiflow).
# A lancer une fois depuis C:\codespace\auto-ecole :  powershell -ExecutionPolicy Bypass -File .\nettoyage-admin.ps1
$src = Join-Path $PSScriptRoot "apps\admin\src"
$old = @(
  "app\(admin)\[section]",
  "app\(admin)\eleves",
  "app\(admin)\planning",
  "app\(admin)\dashboard.module.css",
  "app\(admin)\page.tsx",
  "components\dashboard",
  "components\inscription",
  "components\notifications-panel.module.css",
  "components\notifications-panel.tsx",
  "components\page-top.module.css",
  "components\page-top.tsx",
  "components\shell.module.css",
  "components\shell.tsx",
  "components\side-panel.module.css",
  "components\side-panel.tsx",
  "components\ui.tsx",
  "lib\nav.ts",
  "lib\panels.ts",
  "app\(admin)\admin\loading.tsx"
)
foreach ($p in $old) {
  $full = Join-Path $src $p
  if (Test-Path -LiteralPath $full) { Remove-Item -LiteralPath $full -Recurse -Force; Write-Host "supprime : $p" }
}
# cache de Next, reconstruit au prochain lancement
$cache = Join-Path $PSScriptRoot "apps\admin\.next"
if (Test-Path -LiteralPath $cache) { Remove-Item -LiteralPath $cache -Recurse -Force; Write-Host "cache .next vide" }
Write-Host "Nettoyage termine. Lance maintenant : npm install puis npm run admin"
