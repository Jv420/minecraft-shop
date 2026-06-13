# DynathiSMP Minecraft Store

Complete Minecraft-webshop voor DynathiSMP met Stripe, Vercel, MySQL, Discord en automatische levering via een Paper-plugin.

## Snel overzicht

De volledige flow is:

```txt
Speler kiest product
→ Stripe Checkout
→ Stripe webhook bevestigt betaling
→ order wordt opgeslagen in MySQL
→ DynathiStoreBridge haalt order op
→ consolecommands worden uitgevoerd
→ status wordt delivered of failed
→ Discord ontvangt meldingen
```

## Belangrijkste onderdelen

- Stripe Checkout met iDEAL, kaart en Bancontact
- Productcatalogus in `lib/products.js`
- MySQL-orderqueue
- Paper-plugin voor lokale commanduitvoering
- In-game beheer-GUI
- Discord-logboek voor betalingen en leveringen
- Automatisch herstel van betaalde Stripe-sessies die niet in MySQL staan
- PowerShell-scripts voor tests en giveaways

## Documentatie

Gebruik de wiki in de map [`docs`](docs/README.md):

- [Installatie en deployment](docs/INSTALLATIE.md)
- [Stripe configuratie](docs/STRIPE.md)
- [MySQL en orderstatussen](docs/DATABASE.md)
- [Paper-plugin](docs/PAPER-PLUGIN.md)
- [Producten beheren](docs/PRODUCTEN.md)
- [PowerShell tests en giveaways](docs/POWERSHELL.md)
- [Problemen oplossen](docs/TROUBLESHOOTING.md)
- [Beveiliging en onderhoud](docs/BEVEILIGING.md)

## Vereisten

- Paper 1.21.11
- Java 21
- Maven 3.9 of nieuwer
- Vercel-account
- Stripe-account
- extern bereikbare MySQL/MariaDB-database
- Discord-webhook

## Projectstructuur

```txt
api/
  create-checkout-session.js
  order-status.js
  sync-paid-order.js
  stripe-webhook.js
  products.js
  plugin/
    orders.js
    complete.js
    admin-orders.js
    retry-order.js
    gift-order.js
    test-order.js
lib/
  db.js
  discord.js
  orders.js
  products.js
public/
  index.html
  success.html
  cancel.html
  style.css
paper-plugin/
  pom.xml
  src/main/java/nl/dynathi/store/
  src/main/resources/
scripts/
  test-store.ps1
  test-db-order.ps1
  random-giveaway.ps1
docs/
```

## Environment variables

Zet deze in Vercel:

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
STORE_URL=https://minecraft-shop-iota.vercel.app
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
PLUGIN_SECRET=een-lange-willekeurige-geheime-sleutel
MYSQL_HOST=jouw-host
MYSQL_PORT=3306
MYSQL_USER=jouw-user
MYSQL_PASSWORD=jouw-wachtwoord
MYSQL_DATABASE=jouw-database
MYSQL_SSL=false
```

Gebruik nooit echte secrets in GitHub.

## Vercel deployen

```txt
Vercel
→ Add New Project
→ importeer Jv420/minecraft-shop
→ Framework Preset: Other
→ Root Directory: ./
→ Output Directory: public
→ Install Command: npm install
```

Na iedere wijziging in backend, frontend of producten:

```txt
Vercel → Deployments → Redeploy
```

## Stripe webhook

Webhook URL:

```txt
https://minecraft-shop-iota.vercel.app/api/stripe-webhook
```

Activeer minimaal:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
```

De live Stripe secret en live webhook secret moeten bij elkaar horen.

## Paper-plugin bouwen

```powershell
cd paper-plugin
mvn clean package
```

Upload de JAR uit:

```txt
paper-plugin/target/
```

naar:

```txt
plugins/
```

Pluginconfig:

```yaml
api-url: "https://minecraft-shop-iota.vercel.app"
api-secret: "DEZELFDE_WAARDE_ALS_PLUGIN_SECRET"
check-interval-seconds: 10
request-timeout-seconds: 15

logging:
  commands: true
  responses: true
```

## Producten

Alle producten staan in:

```txt
lib/products.js
```

Prijzen staan in eurocenten:

```txt
499  = €4,99
999  = €9,99
2999 = €29,99
```

De huidige Ultimate Bundle kost €29,99. DonutCrates-commands zijn tijdelijk uitgeschakeld totdat de licentie weer actief is.

## PowerShell scripts

Algemene controle:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-store.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -StripeSessionId "cs_live_..."
```

DB-testorder:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-db-order.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi" `
  -ProductId "live_test_bundle"
```

Random giveaway:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\random-giveaway.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi"
```

## Orderstatussen

```txt
pending_delivery  wacht op de Paper-plugin
processing        plugin heeft de order opgehaald
delivered         levering gelukt
failed            één of meer commands mislukt
```

## Belangrijke waarschuwingen

- Deel `PLUGIN_SECRET`, Stripe-secrets, MySQL-wachtwoorden en Discord-webhooks nooit openbaar.
- Testkaartgegevens werken niet met live Stripe-keys.
- Een succesvolle betaling betekent pas een afgeronde aankoop wanneer de order ook `delivered` is.
- Gebruik geen handmatige retry op een `processing` order zonder eerst te controleren welke commands al zijn uitgevoerd.
- DonutCrates-producten blijven uitgeschakeld totdat `keymanager` weer correct werkt.

## Huidige productie-URL

```txt
https://minecraft-shop-iota.vercel.app
```
