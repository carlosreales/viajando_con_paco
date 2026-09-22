@echo off
set "NODE_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_RUNTIME%" (
  echo No se encontro el runtime de Node incluido con Codex.
  pause
  exit /b 1
)
"%NODE_RUNTIME%" --env-file-if-exists=.env server.mjs
pause
