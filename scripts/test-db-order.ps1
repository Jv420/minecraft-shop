param(
    [string]$StoreUrl = "https://minecraft-shop-iota.vercel.app",
    [Parameter(Mandatory = $true)]
    [string]$PluginSecret,
    [Parameter(Mandatory = $true)]
    [string]$Player,
    [string]$ProductId = "live_test_bundle",
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

$headers = @{
    "x-plugin-secret" = $PluginSecret
    "content-type"    = "application/json"
}

Write-Host "DynathiSMP DB Bestellingstest" -ForegroundColor Magenta
Write-Host "Store:   $StoreUrl"
Write-Host "Speler:  $Player"
Write-Host "Product: $ProductId"

try {
    Write-Step "Testorder aanmaken in MySQL"

    $body = @{
        player    = $Player
        productId = $ProductId
        actor     = "PowerShell DB test"
    } | ConvertTo-Json

    $created = Invoke-RestMethod `
        -Uri "$StoreUrl/api/plugin/test-order" `
        -Method Post `
        -Headers $headers `
        -Body $body

    $orderId = $created.order.id
    Write-Ok "Testorder aangemaakt: $orderId"
    Write-Host "Startstatus: $($created.order.status)"
}
catch {
    Write-Fail "Testorder aanmaken mislukt: $($_.Exception.Message)"
    exit 1
}

Write-Step "Wachten tot de Paper-plugin de bestelling verwerkt"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$lastStatus = ""

while ((Get-Date) -lt $deadline) {
    try {
        $orders = Invoke-RestMethod `
            -Uri "$StoreUrl/api/plugin/admin-orders" `
            -Method Get `
            -Headers @{ "x-plugin-secret" = $PluginSecret }

        $order = @($orders.orders) | Where-Object { $_.id -eq $orderId } | Select-Object -First 1

        if (-not $order) {
            Write-Warn "Order nog niet teruggevonden in admin-overzicht"
        }
        else {
            if ($order.status -ne $lastStatus) {
                Write-Host "Status: $($order.status)" -ForegroundColor White
                if ($order.message) {
                    Write-Host "Melding: $($order.message)"
                }
                $lastStatus = $order.status
            }

            if ($order.status -eq "delivered") {
                Write-Ok "Bestelling is succesvol uitgevoerd op de Minecraft-server"
                Write-Host "Order ID: $orderId"
                exit 0
            }

            if ($order.status -eq "failed") {
                Write-Fail "Bestelling is door de plugin als mislukt gemarkeerd"
                Write-Host "Melding: $($order.message)"
                Write-Host "Order ID: $orderId"
                exit 2
            }
        }
    }
    catch {
        Write-Warn "Statuscontrole mislukt: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 3
}

Write-Fail "Timeout na $TimeoutSeconds seconden"
Write-Host "Controleer met: /storebridge check"
Write-Host "Order ID: $orderId"
exit 3
