param(
    [ValidateSet("prod", "dev", "all")]
    [string]$Mode = "prod",

    [ValidateSet("up", "down")]
    [string]$Action = "up",

    [switch]$WithTools,
    [switch]$SkipBrowser,
    [int]$WaitSeconds = 180
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Get-RepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-DockerCli {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI was not found. Install Docker Desktop, launch it, then try again."
    }
}

function Ensure-DockerEngine {
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop is not ready yet. Start Docker Desktop, wait until it says it is running, then try again."
    }
}

function Ensure-EnvFile {
    param([string]$RepoRoot)

    $envPath = Join-Path $RepoRoot ".env.docker"
    $templatePath = Join-Path $RepoRoot ".env.docker.example"

    if (-not (Test-Path $envPath)) {
        Copy-Item $templatePath $envPath
        Write-Step "Created .env.docker from .env.docker.example."
    }

    return $envPath
}

function Read-EnvValue {
    param(
        [string]$EnvPath,
        [string]$Name,
        [string]$DefaultValue
    )

    if (-not (Test-Path $EnvPath)) {
        return $DefaultValue
    }

    foreach ($line in Get-Content $EnvPath) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Length -ne 2) {
            continue
        }

        if ($parts[0].Trim() -eq $Name) {
            $value = $parts[1].Trim()
            if ($value) {
                return $value
            }
        }
    }

    return $DefaultValue
}

function Get-ComposeFileSet {
    param([string]$Mode)

    switch ($Mode) {
        "prod" { return @("docker-compose.yml") }
        "dev" { return @("docker-compose.dev.yml") }
        "all" { return @("docker-compose.yml", "docker-compose.dev.yml") }
    }
}

function Invoke-DockerCompose {
    param(
        [string[]]$ComposeFiles,
        [string]$EnvPath,
        [string[]]$ExtraArgs
    )

    $args = @("compose")
    foreach ($composeFile in $ComposeFiles) {
        $args += @("-f", $composeFile)
    }
    $args += @("--env-file", $EnvPath)
    $args += $ExtraArgs

    & docker @args
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed."
    }
}

function Wait-ForUrl {
    param(
        [string]$Url,
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
        }

        Start-Sleep -Seconds 3
    }

    return $false
}

if ($Action -eq "up" -and $Mode -eq "all") {
    throw "Mode 'all' is only valid with Action 'down'."
}

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

Ensure-DockerCli
Ensure-DockerEngine

$envPath = if ($Action -eq "up") {
    Ensure-EnvFile -RepoRoot $repoRoot
} elseif (Test-Path (Join-Path $repoRoot ".env.docker")) {
    Join-Path $repoRoot ".env.docker"
} else {
    Join-Path $repoRoot ".env.docker.example"
}

if ($Action -eq "up") {
    $composeFiles = Get-ComposeFileSet -Mode $Mode
    $extraArgs = @("up", "--build", "-d")
    if ($Mode -eq "prod" -and $WithTools) {
        $extraArgs = @("--profile", "tools") + $extraArgs
    }

    Write-Step "Building and starting the $Mode Docker stack..."
    Invoke-DockerCompose -ComposeFiles $composeFiles -EnvPath $envPath -ExtraArgs $extraArgs

    $frontendPort = Read-EnvValue -EnvPath $envPath -Name "FRONTEND_PORT" -DefaultValue "5173"
    $backendPort = Read-EnvValue -EnvPath $envPath -Name "BACKEND_PORT" -DefaultValue "8000"
    $mongoPort = Read-EnvValue -EnvPath $envPath -Name "MONGO_PORT" -DefaultValue "27017"
    $mongoExpressPort = Read-EnvValue -EnvPath $envPath -Name "MONGO_EXPRESS_PORT" -DefaultValue "8081"

    $frontendUrl = "http://localhost:$frontendPort/"
    $backendUrl = "http://localhost:$backendPort/api/v1"

    Write-Step "Waiting for the frontend to respond..."
    $frontendReady = Wait-ForUrl -Url $frontendUrl -TimeoutSeconds $WaitSeconds

    Write-Host ""
    Write-Host "IranAPI is starting." -ForegroundColor Green
    Write-Host "Frontend: $frontendUrl"
    Write-Host "Backend API: $backendUrl"
    Write-Host "MongoDB: mongodb://localhost:$mongoPort"
    if ($Mode -eq "prod" -and $WithTools) {
        Write-Host "Mongo Express: http://localhost:$mongoExpressPort"
    }
    Write-Host ""
    Write-Host "To stop everything later, double-click Stop-IranAPI.bat." -ForegroundColor Yellow

    if (-not $SkipBrowser) {
        if ($frontendReady) {
            Start-Process $frontendUrl
        } else {
            Write-Host ""
            Write-Host "The stack started, but the frontend did not become reachable within $WaitSeconds seconds." -ForegroundColor Yellow
            Write-Host "Check logs with: docker compose --env-file .env.docker logs -f"
        }
    }
} else {
    $targetModes = if ($Mode -eq "all") { @("prod", "dev") } else { @($Mode) }
    foreach ($targetMode in $targetModes) {
        $composeFiles = Get-ComposeFileSet -Mode $targetMode
        Write-Step "Stopping the $targetMode Docker stack..."
        try {
            Invoke-DockerCompose -ComposeFiles $composeFiles -EnvPath $envPath -ExtraArgs @("down", "--remove-orphans")
        } catch {
            Write-Host "Skipping $targetMode stack because it could not be stopped cleanly." -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "IranAPI containers have been stopped." -ForegroundColor Green
}
