param(
    [string]$StoreUrl = "https://minecraft-shop-iota.vercel.app",
    [Parameter(Mandatory = $true)]
    [string]$PluginSecret,
    [Parameter(Mandatory = $true)]
    [string]$Player,
    [string[]]$ExcludeProductIds = @(),
    [switch]$DryRun,
    [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"
$StoreUrl = $StoreUrl.TrimEnd('/')

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

Write-Host "DynathiSMP Random Giveaway" -ForegroundColor Magenta
Write-Host "Store:  $StoreUrl"
Write-Host "Speler: $Player"

if ($Player -notmatch '^[a-zA-Z0-9_\.]{3,16}$') {
    Write-Fail "Ongeldige Minecraft spelernaam"
    exit 1
}

try {
    Write-Step "Producten uit de webshop ophalen"
    $products = @(Invoke-RestMethod -Uri "$StoreUrl/api/products" -Method Get)

    if ($products.Count -eq 0) {
        throw "Geen producten ontvangen"
    }

    Write-Ok "$($products.Count) producten gevonden"
}
catch {
    Write-Fail "Producten ophalen mislukt: $($_.Exception.Message)"
    exit 1
}

$eligibleProducts = @($products | Where-Object {
    $ExcludeProductIds -notcontains $_.id
})

if ($eligibleProducts.Count -eq 0) {
    Write-Fail "Geen producten over na toepassen van de uitsluitingen"
    exit 1
}

Write-Step "Willekeurig giveaway-product kiezen"
$selected = $eligibleProducts | Get-Random
$price = [math]::Round(([double]$selected.price / 100), 2)

Write-Host "Product ID: $($selected.id)"
Write-Host "Naam:       $($selected.name)"
Write-Host "Categorie:  $($selected.category)"
Write-Host "Waarde:     EUR $price"
Write-Host "Beschrijving: $($selected.description)"

if ($DryRun) {
    Write-Warn "DryRun actief: er is geen bestelling aangemaakt"
    exit 0
}

$headers = @{
    "x-plugin-secret" = $PluginSecret
    "content-type"    = "application/json"
}

$body = @{
    player    = $Player
    productId = $selected.id
    actor     = "PowerShell random giveaway"
} | ConvertTo-Json

try {
    Write-Step "Gratis giveaway-order aanmaken"

    $created = Invoke-RestMethod `
        -Uri "$StoreUrl/api/plugin/gift-order" `
        -Method Post `
        -Headers $headers `
        -Body $body

    $orderId = $created.order.id
    Write-Ok "Giveaway-order aangemaakt: $orderId"
    Write-Host "Startstatus: $($created.order.status)"
}
catch {
    Write-Fail "Giveaway-order aanmaken mislukt: $($_.Exception.Message)"
    exit 2
}

Write-Step "Wachten op levering door de Paper-plugin"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$lastStatus = ""

while ((Get-Date) -lt $deadline) {
    try {
        $orders = Invoke-RestMethod `
            -Uri "$StoreUrl/api/plugin/admin-orders" `
            -Method Get `
            -Headers @{ "x-plugin-secret" = $PluginSecret }

        $order = @($orders.orders) | Where-Object { $_.id -eq $orderId } | Select-Object -First 1

        if ($order) {
            if ($order.status -ne $lastStatus) {
                Write-Host "Status: $($order.status)"
                if ($order.message) {
                    Write-Host "Melding: $($order.message)"
                }
                $lastStatus = $order.status
            }

            if ($order.status -eq "delivered") {
                Write-Ok "Giveaway succesvol geleverd aan $Player"
                Write-Host "Gewonnen product: $($selected.name)"
                Write-Host "Order ID: $orderId"
                exit 0
            }

            if ($order.status -eq "failed") {
                Write-Fail "Giveaway-levering mislukt"
                Write-Host "Melding: $($order.message)"
                Write-Host "Order ID: $orderId"
                exit 3
            }
        }
        else {
            Write-Warn "Order nog niet zichtbaar in het admin-overzicht"
        }
    }
    catch {
        Write-Warn "Statuscontrole mislukt: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 3
}

Write-Fail "Timeout na $TimeoutSeconds seconden"
Write-Host "Controleer de order via /storegui of /storebridge check"
Write-Host "Order ID: $orderId"
exit 4
