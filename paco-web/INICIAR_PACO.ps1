Set-Location -LiteralPath $PSScriptRoot
$node = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'No se encontró el runtime de Node incluido con Codex.' }
& $node --env-file-if-exists=.env server.mjs
