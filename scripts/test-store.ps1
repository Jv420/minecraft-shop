param(
    [string]$StoreUrl = "https://minecraft-shop-iota.vercel.app",
    [string]$PluginSecret = "",
    [string]$StripeSessionId = ""
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

$StoreUrl = $StoreUrl.TrimEnd('/')

Write-Host "DynathiSMP Store Test Script" -ForegroundColor Magenta
Write-Host "Store: $StoreUrl"

try {
    Write-Step "Homepage controleren"
    $home = Invoke-WebRequest -Uri $StoreUrl -Method Get -UseBasicParsing
    if ($home.StatusCode -eq 200) {
        Write-Ok "Homepage bereikbaar"
    }
} catch {
    Write-Fail "Homepage niet bereikbaar: $($_.Exception.Message)"
}

try {
    Write-Step "Producten-API controleren"
    $products = Invoke-RestMethod -Uri "$StoreUrl/api/products" -Method Get
    $count = @($products).Count
    Write-Ok "$count producten gevonden"

    $testBundle = @($products) | Where-Object { $_.id -eq 'live_test_bundle' }
    if ($testBundle) {
        Write-Ok "Tijdelijke testbundel gevonden voor $($testBundle.price) cent"
    } else {
        Write-Warn "Tijdelijke testbundel niet gevonden"
    }
} catch {
    Write-Fail "Producten-API fout: $($_.Exception.Message)"
}

if ($PluginSecret) {
    $headers = @{ 'x-plugin-secret' = $PluginSecret }

    try {
        Write-Step "Plugin order-endpoint controleren"
        $orders = Invoke-RestMethod -Uri "$StoreUrl/api/plugin/orders" -Method Get -Headers $headers
        Write-Ok "Plugin endpoint bereikbaar. Orders opgehaald: $(@($orders.orders).Count)"
    } catch {
        $response = $_.Exception.Response
        if ($response) {
            Write-Fail "Plugin endpoint HTTP-fout: $([int]$response.StatusCode)"
        } else {
            Write-Fail "Plugin endpoint fout: $($_.Exception.Message)"
        }
    }

    try {
        Write-Step "Admin orderoverzicht controleren"
        $adminOrders = Invoke-RestMethod -Uri "$StoreUrl/api/plugin/admin-orders" -Method Get -Headers $headers
        Write-Ok "Admin endpoint bereikbaar. Recente orders: $(@($adminOrders.orders).Count)"

        foreach ($order in @($adminOrders.orders | Select-Object -First 10)) {
            Write-Host (" - {0} | {1} | {2} | {3}" -f $order.player, $order.productName, $order.status, $order.id)
        }
    } catch {
        Write-Fail "Admin orders fout: $($_.Exception.Message)"
    }
} else {
    Write-Warn "Geen PluginSecret opgegeven; beveiligde plugin-endpoints worden overgeslagen"
}

if ($StripeSessionId) {
    try {
        Write-Step "Stripe sessie en orderstatus controleren"
        $statusUrl = "$StoreUrl/api/order-status?session_id=$([uri]::EscapeDataString($StripeSessionId))"
        $status = Invoke-RestMethod -Uri $statusUrl -Method Get

        Write-Host "Speler:         $($status.player)"
        Write-Host "Betaalstatus:   $($status.paymentStatus)"
        Write-Host "Orderstatus:    $($status.orderStatus)"
        Write-Host "Ordermelding:   $($status.orderMessage)"

        if ($status.paymentStatus -eq 'paid') {
            Write-Ok "Stripe betaling is betaald"
        } else {
            Write-Warn "Stripe betaling is nog niet paid"
        }

        if ($status.orderStatus -eq 'delivered') {
            Write-Ok "Minecraft levering is afgerond"
        } elseif ($status.orderStatus -eq 'failed') {
            Write-Fail "Minecraft levering is mislukt"
        } else {
            Write-Warn "Minecraft levering is nog niet afgerond"
        }
    } catch {
        Write-Fail "Orderstatus fout: $($_.Exception.Message)"
    }
} else {
    Write-Warn "Geen StripeSessionId opgegeven; orderstatuscontrole wordt overgeslagen"
}

Write-Host "`nTest afgerond." -ForegroundColor Magenta
