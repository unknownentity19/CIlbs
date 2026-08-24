<#
.SYNOPSIS
  Dumps the Cilbs database and keeps a rolling window of dumps.

.DESCRIPTION
  The repository's GitHub Actions backup job cannot help a self-hosted setup —
  it runs on GitHub's network and a Postgres bound to localhost is not
  reachable from there. This is the local equivalent: run it from Task
  Scheduler once a day.

  Register it (as Administrator, adjusting the paths):

    $action  = New-ScheduledTaskAction -Execute "powershell.exe" `
                 -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\cilbs\deploy\windows\backup.ps1"'
    $trigger = New-ScheduledTaskTrigger -Daily -At 3:17am
    Register-ScheduledTask -TaskName "Cilbs backup" -Action $action -Trigger $trigger `
                 -RunLevel Highest -Description "Daily pg_dump of the Cilbs database"

  Restore a dump with:
    psql -U cilbs -d cilbs -f C:\cilbs\backups\cilbs-2026-08-24.sql

.NOTES
  A backup nobody has restored is a guess. Try one into a scratch database
  before you need it.
#>
[CmdletBinding()]
param(
  [string]$Database = "cilbs",
  [string]$Username = "cilbs",
  [string]$DbHost = "127.0.0.1",
  [int]$Port = 5432,
  # Read from the environment by default so the password isn't a literal here.
  [string]$Password = $env:PGPASSWORD,
  [string]$OutputDirectory = "C:\cilbs\backups",
  [int]$KeepDays = 30
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump is not on PATH. Add PostgreSQL's bin directory (e.g. C:\Program Files\PostgreSQL\16\bin) to the system PATH."
}
if ([string]::IsNullOrWhiteSpace($Password)) {
  throw "No password. Pass -Password, or set PGPASSWORD for the account this task runs as."
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd"
$dump = Join-Path $OutputDirectory "cilbs-$stamp.sql"

$env:PGPASSWORD = $Password
try {
  pg_dump --no-owner --no-privileges --clean --if-exists `
    --host $DbHost --port $Port --username $Username --dbname $Database `
    --file $dump
  if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with $LASTEXITCODE" }
} finally {
  # Don't leave the password sitting in the session's environment.
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Compress, then drop the plain copy.
$archive = "$dump.zip"
Compress-Archive -Path $dump -DestinationPath $archive -Force
Remove-Item $dump

$cutoff = (Get-Date).AddDays(-$KeepDays)
Get-ChildItem -Path $OutputDirectory -Filter "cilbs-*.sql.zip" |
  Where-Object { $_.LastWriteTime -lt $cutoff } |
  Remove-Item -Force

$size = [math]::Round((Get-Item $archive).Length / 1KB, 1)
Write-Host "Wrote $archive ($size KB). Keeping $KeepDays days."
