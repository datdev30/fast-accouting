# Script to create Android keystore
# This script will create a keystore file for signing the release APK

$keystoreFile = "fastaccounting-release.keystore"
$alias = "fastaccounting"
$storePassword = "fastaccounting123"
$keyPassword = "fastaccounting123"
$validity = 10000

# Try to find keytool
$keytoolPath = $null

# Check common Java locations
$javaPaths = @(
    "$env:JAVA_HOME\bin\keytool.exe",
    "C:\Program Files\Java\*\bin\keytool.exe",
    "C:\Program Files (x86)\Java\*\bin\keytool.exe"
)

foreach ($path in $javaPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $keytoolPath = $resolved[0].Path
        break
    }
}

# Try to find from java command
if (-not $keytoolPath) {
    try {
        $javaCmd = Get-Command java -ErrorAction Stop
        $javaDir = Split-Path (Split-Path $javaCmd.Source)
        $keytoolPath = Join-Path $javaDir "bin\keytool.exe"
        if (-not (Test-Path $keytoolPath)) {
            $keytoolPath = $null
        }
    } catch {
        Write-Host "Java not found in PATH"
    }
}

if (-not $keytoolPath -or -not (Test-Path $keytoolPath)) {
    Write-Host "ERROR: keytool not found. Please install JDK or add it to PATH."
    Write-Host ""
    Write-Host "You can create keystore manually using:"
    Write-Host "keytool -genkey -v -keystore $keystoreFile -alias $alias -keyalg RSA -keysize 2048 -validity $validity"
    Write-Host ""
    Write-Host "Or download JDK from: https://adoptium.net/"
    exit 1
}

Write-Host "Found keytool at: $keytoolPath"
Write-Host "Creating keystore: $keystoreFile"

$dname = "CN=Fast Accouting, OU=Development, O=FastAccounting, L=City, ST=State, C=VN"

& $keytoolPath -genkey -v `
    -keystore $keystoreFile `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity $validity `
    -storepass $storePassword `
    -keypass $keyPassword `
    -dname $dname

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Keystore created successfully!"
    Write-Host "File: $keystoreFile"
    Write-Host "Alias: $alias"
    Write-Host "Store Password: $storePassword"
    Write-Host "Key Password: $keyPassword"
    Write-Host ""
    Write-Host "IMPORTANT: Keep this keystore file and passwords safe!"
} else {
    Write-Host "Failed to create keystore"
    exit 1
}
