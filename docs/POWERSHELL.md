# PowerShell scripts

Alle scripts staan in:

```txt
scripts/
```

## 1. Algemene store- en Stripe-test

Bestand:

```txt
scripts/test-store.ps1
```

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-store.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -StripeSessionId "cs_live_..."
```

Controleert:

```txt
homepage
producten-API
plugin-endpoint
admin-orders
Stripe betaalstatus
Minecraft leveringsstatus
```

## 2. DB-testbestelling

Bestand:

```txt
scripts/test-db-order.ps1
```

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-db-order.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi" `
  -ProductId "live_test_bundle"
```

Deze test slaat Stripe over en maakt rechtstreeks een beveiligde testorder in MySQL aan.

## 3. Random giveaway

Bestand:

```txt
scripts/random-giveaway.ps1
```

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\random-giveaway.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi"
```

Alleen een winnaar/product kiezen zonder levering:

```powershell
-DryRun
```

Producten uitsluiten:

```powershell
-ExcludeProductIds "legend","mega_bundle","live_test_bundle"
```

## Execution Policy fout

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass -File ".\script.ps1"
```

of alleen voor het huidige PowerShell-venster:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Veiligheid

Plaats `PLUGIN_SECRET` nooit rechtstreeks in het script en commit hem nooit naar GitHub.
