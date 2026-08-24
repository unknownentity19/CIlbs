<#
.SYNOPSIS
  Registers Cilbs as a Windows service so it survives reboots.

.DESCRIPTION
  Uses NSSM, which turns any executable into a proper Windows service with
  logging and automatic restart. PM2 also works, but its Windows startup story
  depends on a helper package that breaks across major versions; a real service
  is the thing that reliably comes back after a reboot.

  Install NSSM first:  winget install NSSM.NSSM

  The service runs Next's own CLI through node rather than `npm run start`, so
  there's no cmd.exe shim between the service manager and the process it is
  supposed to supervise — otherwise stopping the service can leave node behind.

.EXAMPLE
  .\install-service.ps1 -ProjectPath C:\cilbs -Port 3000
#>
[CmdletBinding()]
param(
  [string]$ProjectPath = (Resolve-Path "$PSScriptRoot\..\.."),
  [string]$ServiceName = "Cilbs",
  [int]$Port = 3000,
  [string]$BindAddress = "127.0.0.1",
  [string]$LogDirectory = "C:\cilbs\logs"
)

$ErrorActionPreference = "Stop"

function Require-Command($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "$name was not found on PATH. $hint"
  }
}

Require-Command "nssm" "Install it with: winget install NSSM.NSSM"
Require-Command "node" "Install Node 20 or newer from https://nodejs.org"

$node = (Get-Command node).Source
$nextCli = Join-Path $ProjectPath "node_modules\next\dist\bin\next"

if (-not (Test-Path $nextCli)) {
  throw "Next was not found at $nextCli. Run 'npm ci' in $ProjectPath first."
}
if (-not (Test-Path (Join-Path $ProjectPath ".next"))) {
  throw "No build found in $ProjectPath\.next. Run 'npm run build' first."
}
if (-not (Test-Path (Join-Path $ProjectPath ".env.local"))) {
  Write-Warning "No .env.local in $ProjectPath - the app will start without a database, so accounts will be unavailable."
}

New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null

# Replace any previous registration so this script can be re-run after an update.
if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
  Write-Host "Removing the existing $ServiceName service..."
  nssm stop $ServiceName | Out-Null
  nssm remove $ServiceName confirm | Out-Null
  Start-Sleep -Seconds 2
}

Write-Host "Registering $ServiceName..."
nssm install $ServiceName $node "`"$nextCli`" start --hostname $BindAddress --port $Port"
nssm set $ServiceName AppDirectory $ProjectPath
nssm set $ServiceName AppStdout (Join-Path $LogDirectory "cilbs.out.log")
nssm set $ServiceName AppStderr (Join-Path $LogDirectory "cilbs.err.log")
nssm set $ServiceName AppRotateFiles 1
nssm set $ServiceName AppRotateBytes 10485760
nssm set $ServiceName Start SERVICE_AUTO_START
nssm set $ServiceName AppEnvironmentExtra "NODE_ENV=production"
# Give it a moment before deciding a crash-loop is real.
nssm set $ServiceName AppThrottle 5000

Write-Host "Starting $ServiceName..."
nssm start $ServiceName

Write-Host ""
Write-Host "Done. The app is on http://${BindAddress}:$Port (local only by design -"
Write-Host "put Caddy or IIS in front of it for HTTPS; see deploy/windows/Caddyfile)."
Write-Host "Logs: $LogDirectory"
