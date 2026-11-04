# Réorganise le dossier en monorepo : apps/mobile, apps/admin, packages/shared, supabase
# Lancer depuis C:\codespace\auto-ecole :
#   powershell -ExecutionPolicy Bypass -File .\migrer-monorepo.ps1

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

if (-not (Test-Path '_migration')) {
  Write-Host 'Le dossier _migration est introuvable : la migration a déjà été faite.' -ForegroundColor Yellow
  exit 0
}

Write-Host '1/4  Déplacement de l''app Expo dans apps\mobile…' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path 'apps\mobile' | Out-Null
foreach ($item in @('src', 'assets', 'app.json', 'tsconfig.json', 'AGENTS.md', 'expo-env.d.ts')) {
  if (Test-Path $item) { Move-Item -LiteralPath $item -Destination "apps\mobile\$item" }
}

Write-Host '2/4  Suppression des anciennes dépendances…' -ForegroundColor Cyan
foreach ($item in @('node_modules', '.expo', 'package-lock.json')) {
  if (Test-Path $item) { Remove-Item -Recurse -Force $item }
}

Write-Host '3/4  Mise en place des nouveaux fichiers…' -ForegroundColor Cyan
Get-ChildItem -Path '_migration' -Recurse -File -Force | ForEach-Object {
  $relative = $_.FullName.Substring((Resolve-Path '_migration').Path.Length + 1)
  $target = Join-Path $PSScriptRoot $relative
  New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $target -Force
}
Remove-Item -Recurse -Force '_migration'

Write-Host '4/4  Installation (npm install)…' -ForegroundColor Cyan
npm install

Write-Host ''
Write-Host 'Terminé !' -ForegroundColor Green
Write-Host '  npm run mobile   -> app mobile (Expo Go)'
Write-Host '  npm run admin    -> site admin sur http://localhost:3000'
