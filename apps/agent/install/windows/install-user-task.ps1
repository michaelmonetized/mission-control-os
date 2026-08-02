# Mission Control Local Agent — per-user scheduled task (ADR-0013)
# Run: powershell -ExecutionPolicy Bypass -File install-user-task.ps1 -AgentBin path\to\mc-agent.exe

param(
  [Parameter(Mandatory = $true)][string]$AgentBin,
  [string]$ControlPlane = "http://127.0.0.1:5173",
  [string]$TaskName = "MissionControlAgent"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $AgentBin)) {
  throw "Agent binary not found: $AgentBin"
}

$action = New-ScheduledTaskAction -Execute $AgentBin -Argument "daemon --control-plane $ControlPlane"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName
Write-Host "Installed and started user task: $TaskName"
Write-Host "Control plane: $ControlPlane"
