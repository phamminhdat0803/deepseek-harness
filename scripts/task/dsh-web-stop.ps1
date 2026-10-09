# Stops the DSH Web GUI started by the scheduled task "dsh-web".
#
# Why this exists: ending that task from Task Scheduler kills only wscript.exe.
# The server is a GRANDCHILD (wscript -> cmd -> node), so node.exe survives, keeps
# port 3080 bound, and the task snapshot still reads "Running" (Last Result
# 267009 = 0x41301 = "task is currently running"). This script stops the real
# process, then the wrappers above it, and verifies the port was released.
#
# Usage:
#   dsh-web-stop.ps1              stop it for real
#   dsh-web-stop.ps1 -WhatIfOnly  show what would be stopped, change nothing
[CmdletBinding()]
param(
  [int]$Port = 3080,
  [switch]$WhatIfOnly
)

$ErrorActionPreference = 'Stop'

function Get-ProcessRow([int]$ProcessId) {
  Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
}

# The pack's real identity is whoever owns the listening port, not the task name.
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1
if (-not $listener) {
  "dsh web: nothing listening on port {0} - already stopped." -f $Port
  return
}

$serverPid = [int]$listener.OwningProcess
$server = Get-ProcessRow $serverPid
if (-not $server) { throw "port $Port is owned by PID $serverPid, which already exited" }

# Walk up the chain (wscript <- cmd <- node) and keep it only while it belongs to
# this launch: stop when the parent is gone, is not one of the wrappers, or is a
# process we already recorded.
$chain = [System.Collections.Generic.List[object]]::new()
$current = $server
$seen = [System.Collections.Generic.HashSet[int]]::new()
while ($current) {
  if (-not $seen.Add([int]$current.ProcessId)) { break }
  $chain.Add($current)
  $parentPid = [int]$current.ParentProcessId
  if ($parentPid -eq 0) { break }
  $parent = Get-ProcessRow $parentPid
  if (-not $parent) { break }
  if ($parent.Name -notin @('cmd.exe', 'wscript.exe', 'cscript.exe')) { break }
  $current = $parent
}

foreach ($row in $chain) {
  $role = if ([int]$row.ProcessId -eq $serverPid) { 'server' } else { 'wrapper' }
  "{0,-8} PID {1,-6} {2,-12} {3}" -f $role, $row.ProcessId, $row.Name, $row.CreationDate
}

if ($WhatIfOnly) {
  "would stop {0} process(es); nothing was changed." -f $chain.Count
  return
}

# Deepest first: the server, then the wrappers that own it.
foreach ($row in $chain) {
  Stop-Process -Id $row.ProcessId -Force -ErrorAction SilentlyContinue
  "stopped  PID {0} ({1})" -f $row.ProcessId, $row.Name
}

# The port is the acceptance check: a surviving listener means a survivor process.
$deadline = (Get-Date).AddSeconds(15)
while ((Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 300
}

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  throw "port $Port is still listening after stopping $($chain.Count) process(es)"
}
"dsh web: stopped; port {0} is free." -f $Port
