# DynathiSMP Webshop — Van aanpassen tot online zetten

Deze handleiding behandelt het volledige traject: producten aanpassen, branding wijzigen, Stripe en MySQL instellen, Vercel deployen, de Paper-plugin bouwen, licenties activeren en alles testen.

---

# 1. Wat je nodig hebt

```txt
GitHub-account
Vercel-account
Stripe-account
MySQL/MariaDB-database
Discord-webhook
Paper 1.21.11 server
Java 21
Maven 3.9+
```

---

# 2. Repository kopiëren of clonen

```powershell
git clone https://github.com/Jv420/minecraft-shop.git
cd minecraft-shop
```

Of download de repository als ZIP via GitHub.

---

# 3. Branding aanpassen

Belangrijkste bestanden:

```txt
public/index.html
public/style.css
public/success.html
public/cancel.html
```

Pas in `public/index.html` aan:

```txt
DynathiSMP Store
servernaam
teksten
beschrijvingen
footer
```

Pas in `public/style.css` aan:

```txt
kleuren
knoppen
kaarten
lettergroottes
achtergronden
responsive layout
```

---

# 4. Producten aanpassen

Open:

```txt
lib/products.js
```

Voorbeeld:

```js
coins_10k: {
  id: 'coins_10k',
  name: '10.000 Coins',
  category: 'Coins',
  price: 299,
  currency: 'eur',
  description: 'Ontvang 10.000 coins.',
  commands: [
    'moneymanager add {player} 10000'
  ]
}
```

Prijsnotatie:

```txt
299 = €2,99
499 = €4,99
999 = €9,99
2999 = €29,99
```

Test ieder command eerst handmatig in de serverconsole.

---

# 5. Lokale test van de website

Installeer dependencies:

```powershell
npm install
```

Start lokaal via Vercel CLI of een simpele lokale server.

Met Vercel CLI:

```powershell
npm install -g vercel
vercel dev
```

Open daarna:

```txt
http://localhost:3000
```

---

# 6. MySQL instellen

Je hebt nodig:

```txt
host
poort
gebruikersnaam
wachtwoord
databasenaam
```

Gebruik geen `localhost` of `127.0.0.1` als Vercel de database moet bereiken.

Environment variables:

```env
MYSQL_HOST=jouw-host
MYSQL_PORT=3306
MYSQL_USER=jouw-user
MYSQL_PASSWORD=jouw-wachtwoord
MYSQL_DATABASE=jouw-database
MYSQL_SSL=false
```

De ordertabel wordt automatisch aangemaakt.

---

# 7. Stripe instellen

Maak eerst een testomgeving.

Test secret key:

```env
STRIPE_SECRET_KEY=sk_test_...
```

Webhook URL:

```txt
https://jouw-domein.nl/api/stripe-webhook
```

Activeer events:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
```

Kopieer de signing secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Na geslaagde tests vervang je testkeys door live keys.

---

# 8. Discord webhook instellen

Maak een webhook in een staff/orderkanaal.

Environment variable:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
```

Discord ontvangt meldingen over checkouts, betalingen, leveringen, fouten en giveaways.

---

# 9. Licentieconfiguratie webshop

Voor commerciële distributie gebruikt de webshop een online licentiecontrole.

Benodigde variabelen:

```env
LICENSE_SERVER_URL=https://jouw-licentieserver.nl
LICENSE_KEY=XXXX-XXXX-XXXX-XXXX
LICENSE_PRODUCT=DYNASTORE-WEB
LICENSE_INSTANCE_ID=klant-domein-of-unieke-installatie-id
LICENSE_REQUIRED=true
LICENSE_CACHE_MINUTES=30
```

De webshop controleert de licentie voordat gevoelige API-routes actief worden.

`LICENSE_INSTANCE_ID` kan bijvoorbeeld zijn:

```txt
klant1.example.com
server-12345
buildbybit-order-9988
```

---

# 10. Vercel deployment

Ga naar:

```txt
Vercel → Add New → Project
```

Importeer de GitHub-repository.

Gebruik:

```txt
Framework Preset: Other
Root Directory: ./
Build Command: leeg
Output Directory: public
Install Command: npm install
```

Voeg alle environment variables toe.

Daarna:

```txt
Deployments → Redeploy
```

---

# 11. Custom domein koppelen

In Vercel:

```txt
Settings → Domains → Add Domain
```

Voeg bijvoorbeeld toe:

```txt
shop.jouwserver.nl
```

Pas daarna aan:

```env
STORE_URL=https://shop.jouwserver.nl
LICENSE_INSTANCE_ID=shop.jouwserver.nl
```

Redeploy opnieuw.

---

# 12. Paper-plugin bouwen

```powershell
cd paper-plugin
mvn clean package
```

De JAR staat in:

```txt
paper-plugin/target/
```

Upload hem naar:

```txt
plugins/
```

---

# 13. Pluginconfig inclusief licentie

```yaml
api-url: "https://shop.jouwserver.nl"
api-secret: "DEZELFDE_WAARDE_ALS_PLUGIN_SECRET"
check-interval-seconds: 10
request-timeout-seconds: 15

license:
  enabled: true
  server-url: "https://jouw-licentieserver.nl"
  key: "XXXX-XXXX-XXXX-XXXX"
  product: "DYNASTORE-PLUGIN"
  instance-id: "jouw-server-id-of-ip"
  check-interval-minutes: 30
  fail-open-minutes: 60

logging:
  commands: true
  responses: true
```

Gebruik voor `instance-id` liever een stabiele server-ID of domein dan een IP dat vaak wijzigt.

---

# 14. Plugin permissions

```txt
dynathistore.shop
dynathistore.gui
dynathistore.admin
```

LuckPerms:

```txt
/lp group default permission set dynathistore.shop true
/lp group admin permission set dynathistore.gui true
/lp group admin permission set dynathistore.admin true
```

---

# 15. Plugin commands

```txt
/buy
/webshop
/storegui
/storebridge status
/storebridge reload
/storebridge check
/storebridge license
```

---

# 16. Testen

## DB-test

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-db-order.ps1" `
  -StoreUrl "https://shop.jouwserver.nl" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi" `
  -ProductId "coins_10k"
```

## Stripe-test

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-store.ps1" `
  -StoreUrl "https://shop.jouwserver.nl" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -StripeSessionId "cs_test_..."
```

## Giveaway-test

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\random-giveaway.ps1" `
  -StoreUrl "https://shop.jouwserver.nl" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi"
```

---

# 17. Live zetten

Checklist:

```txt
[ ] branding aangepast
[ ] producten getest
[ ] MySQL bereikbaar
[ ] Stripe live keys ingesteld
[ ] live webhook actief
[ ] STORE_URL klopt
[ ] LICENSE_KEY geldig
[ ] LICENSE_INSTANCE_ID klopt
[ ] Discord webhook werkt
[ ] plugin licentie geldig
[ ] /buy werkt
[ ] /storegui werkt
[ ] testorder delivered
[ ] echte betaling delivered
```

---

# 18. Verkoop via BuiltByBit / CodeCanyon

Aanbevolen distributie:

```txt
Webshop source ZIP
Paper-plugin JAR
config voorbeelden
installatiehandleiding
licentiecode per aankoop
supportvoorwaarden
changelog
```

Maak per aankoop een unieke licentie aan en koppel deze aan:

```txt
product
klant
maximaal aantal activaties
domein of server-ID
vervaldatum
status
```

Lever nooit je private signing secret of licentiedatabase mee aan klanten.

---

# 19. Belangrijke realiteit over bescherming

Geen enkel licentiesysteem voorkomt kopiëren volledig wanneer je broncode verkoopt. Een koper met volledige broncode kan controles verwijderen.

Betere bescherming:

```txt
verkoop gecompileerde plugin-JAR in plaats van pluginbroncode
houd licentieserver privé
minify of bundle Node-code voor distributie
gebruik signed license responses
controleer zowel webshop als plugin
maak updates en support afhankelijk van geldige licentie
monitor activaties en misbruik
```

Licenties verhogen de drempel en maken beheer mogelijk, maar zijn geen absolute DRM.
