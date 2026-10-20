# Apply the attention gate to an installed @tencent-connect/dsh-qqbot.
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\patches\attention-gate\apply.ps1 [-Profile <name>]
# Then restart the DeepSeek Harness client.
# Re-run this script after every dsh-qqbot upgrade (node_modules is replaced).

param([string]$Profile = '')

$ErrorActionPreference = 'Stop'

$profilesRoot = Join-Path $env:USERPROFILE '.dsh\profiles'
$suffix = 'node_modules\@tencent-connect\dsh-qqbot'

function Test-Qqbot([string]$dir) {
    return (Test-Path (Join-Path $dir 'dist\gateway\middleware-setup.js'))
}

$qqbot = $null
if ($Profile -ne '') {
    $candidate = Join-Path $profilesRoot "$Profile\$suffix"
    if (Test-Qqbot $candidate) { $qqbot = $candidate }
}
if ($qqbot -eq $null -and (Test-Path $profilesRoot)) {
    $found = Get-ChildItem $profilesRoot -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { Join-Path $_.FullName $suffix } |
        Where-Object { Test-Qqbot $_ } |
        Select-Object -First 1
    if ($found) { $qqbot = $found }
}
if ($qqbot -eq $null) {
    Write-Host "ERROR: @tencent-connect/dsh-qqbot not found under $profilesRoot"
    Write-Host "       Install the qqbot plugin first, or pass -Profile <name>."
    exit 1
}

Write-Host "target: $qqbot"

$gateway = Join-Path $qqbot 'dist\gateway'
$mw = Join-Path $gateway 'middleware-setup.js'
$gateSrc = Join-Path $PSScriptRoot 'attention-gate.js'
$dataDir = Join-Path $env:USERPROFILE '.dsh-qqbot'
$configFile = Join-Path $dataDir 'attention.json'

if (-not (Test-Path $gateSrc)) { Write-Host "ERROR: attention-gate.js missing next to this script."; exit 1 }

# backup once per run
$stamp = Get-Date -Format 'yyyyMMddTHHmmss'
$backupDir = Join-Path $dataDir 'backup'
New-Item -ItemType Directory -Force $backupDir | Out-Null
Copy-Item $mw (Join-Path $backupDir "middleware-setup.js.orig-$stamp") -Force

Copy-Item $gateSrc (Join-Path $gateway 'attention-gate.js') -Force

$enc = [System.Text.UTF8Encoding]::new($false)
$text = [System.IO.File]::ReadAllText($mw, [System.Text.Encoding]::UTF8)
$nl = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }

if ($text -notmatch 'attention-gate\.js') {
    $anchor = 'import { questionAnswer } from "../middleware/question-answer.js";'
    $text = $text.Replace($anchor, $anchor + $nl + 'import { attentionGate } from "./attention-gate.js";')
}

if ($text -notmatch 'attentionGate\(logger\)') {
    $anchor2 = '    bot.use(questionAnswer(manager));'
    $insert = $anchor2 + $nl + '    // 8.7 attention gate: answer only when mentioned / name-called / interested'
    $insert = $insert + $nl + '    bot.use(attentionGate(logger));'
    $text = $text.Replace($anchor2, $insert)
}

[System.IO.File]::WriteAllText($mw, $text, $enc)

New-Item -ItemType Directory -Force $dataDir | Out-Null
if (-not (Test-Path $configFile)) {
    $default = @'
{
  "enabled": true,
  "triggers": ["祖母绿", "首席"],
  "interests": ["百合", "吐槽", "低落", "发明", "权力机关", "蠢事", "好累", "难受", "emo", "无聊"]
}
'@
    [System.IO.File]::WriteAllText($configFile, $default, $enc)
    Write-Host "wrote default config: $configFile"
}

Write-Host "attention gate applied."
Write-Host "  - word list: $configFile (hot-reloaded, no restart needed to change words)"
Write-Host "  - backup:    $(Join-Path $backupDir "middleware-setup.js.orig-$stamp")"
Write-Host "Restart the DeepSeek Harness client to take effect."
