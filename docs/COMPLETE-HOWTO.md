# Complete DynathiSMP Store How-To

Deze handleiding beschrijft de volledige installatie, configuratie, bediening en troubleshooting van de DynathiSMP Store.

---

# 1. Overzicht

De volledige flow:

```txt
Speler opent /buy of /webshop
→ speler kiest product in GUI
→ Stripe Checkout-link wordt aangemaakt
→ speler betaalt via browser
→ Stripe webhook bevestigt betaling
→ order wordt opgeslagen in MySQL
→ DynathiStoreBridge haalt order op
→ servercommands worden uitgevoerd
→ order wordt delivered of failed
→ Discord ontvangt meldingen
```

De adminflow:

```txt
Admin opent /storegui
→ orders bekijken
→ gift-order maken
→ random giveaway starten
→ handmatig ordercheck starten
```

---

# 2. Vereisten

```txt
Paper 1.21.11
Java 21
Maven 3.9+
Vercel-account
Stripe-account
MySQL/MariaDB-database
Discord-webhook
```

Productie-URL:

```txt
https://minecraft-shop-iota.vercel.app
```

---

# 3. Repositorystructuur

```txt
api/
  create-checkout-session.js
  order-status.js
  products.js
  stripe-webhook.js
  sync-paid-order.js
  plugin/
    admin-orders.js
    complete.js
    gift-order.js
    orders.js
    retry-order.js
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

---

# 4. Vercel installeren

## 4.1 Project importeren

```txt
Vercel
→ Add New
→ Project
→ Import Jv420/minecraft-shop
```

Instellingen:

```txt
Framework Preset: Other
Root Directory: ./
Build Command: leeg
Output Directory: public
Install Command: npm install
```

## 4.2 Environment variables

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

## 4.3 Redeploy

Na iedere wijziging in `api`, `lib` of `public`:

```txt
Vercel
→ Deployments
→ Redeploy
```

---

# 5. Stripe instellen

## 5.1 Webhook URL

```txt
https://minecraft-shop-iota.vercel.app/api/stripe-webhook
```

## 5.2 Events

Activeer minimaal:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
```

## 5.3 Test en live

Test:

```env
STRIPE_SECRET_KEY=sk_test_...
```

Live:

```env
STRIPE_SECRET_KEY=sk_live_...
```

Gebruik nooit testkaartgegevens met live keys.

## 5.4 Statuspagina

Na betaling:

```txt
/success.html?session_id=cs_live_...
```

De pagina controleert:

```txt
paymentStatus
orderStatus
player
productId
leveringsstatus
```

## 5.5 Automatisch herstel

Wanneer Stripe `paid` is maar er geen order in MySQL staat:

```txt
/api/sync-paid-order
```

Deze route zet de order alsnog veilig in MySQL.

---

# 6. MySQL configureren

Gebruik geen:

```txt
localhost
127.0.0.1
```

Vercel moet de database extern kunnen bereiken.

Ordertabel:

```txt
minecraft_shop_orders
```

Belangrijke statussen:

```txt
pending_delivery
processing
delivered
failed
```

Betekenis:

```txt
pending_delivery = wacht op plugin
processing = plugin heeft order geclaimd
delivered = alle commands gelukt
failed = één of meer commands mislukt
```

---

# 7. Paper-plugin bouwen

## 7.1 Build

```powershell
cd paper-plugin
mvn clean package
```

Gebruik de JAR uit:

```txt
paper-plugin/target/
```

Upload naar:

```txt
plugins/
```

## 7.2 Pluginconfig

Bestand:

```txt
plugins/DynathiStoreBridge/config.yml
```

Voorbeeld:

```yaml
api-url: "https://minecraft-shop-iota.vercel.app"
api-secret: "DEZELFDE_WAARDE_ALS_PLUGIN_SECRET"
check-interval-seconds: 10
request-timeout-seconds: 15

logging:
  commands: true
  responses: true
```

Belangrijk:

```txt
geen slash achter api-url
api-secret exact gelijk aan PLUGIN_SECRET
gebruik HTTPS
```

---

# 8. Alle Minecraft-commands

## Spelerswebshop

```txt
/buy
/webshop
```

`/webshop` is alias van `/buy`.

## Admin GUI

```txt
/storegui
```

## StoreBridge beheer

```txt
/storebridge
/storebridge status
/storebridge reload
/storebridge check
```

Betekenis:

```txt
/storebridge status = toont API en interval
/storebridge reload = herlaadt config.yml
/storebridge check = haalt direct nieuwe orders op
```

---

# 9. Alle permissions

```txt
dynathistore.shop
dynathistore.gui
dynathistore.admin
```

Betekenis:

```txt
dynathistore.shop = toegang tot /buy en /webshop
dynathistore.gui = toegang tot /storegui
dynathistore.admin = toegang tot /storebridge
```

LuckPerms voorbeelden:

```txt
/lp group default permission set dynathistore.shop true
/lp group admin permission set dynathistore.gui true
/lp group admin permission set dynathistore.admin true
/lp group owner permission set dynathistore.gui true
/lp group owner permission set dynathistore.admin true
```

Controleer speler:

```txt
/lp user SpelerNaam permission check dynathistore.shop
```

---

# 10. Spelerswebshop GUI

Open:

```txt
/buy
```

Werking:

```txt
GUI haalt actuele producten op uit /api/products
→ speler klikt product
→ checkout wordt aangemaakt
→ klikbare Stripe-link verschijnt in chat
→ browser opent Stripe Checkout
```

De plugin gebruikt automatisch de Minecraft-naam van de speler.

---

# 11. Admin GUI

Open:

```txt
/storegui
```

Functies:

```txt
Bestellingen bekijken
Cadeau geven
Random giveaway
Orders nu controleren
```

## Bestellingen bekijken

Toont recente orders met statussen:

```txt
delivered
failed
processing
pending_delivery
```

Mislukte of processing-orders kunnen opnieuw worden aangeboden.

Let op: retry van een processing-order kan dubbele levering veroorzaken.

## Cadeau geven

```txt
/storegui
→ Cadeau geven
→ kies online speler
→ kies product
```

De gift-order wordt gratis in MySQL geplaatst en door de plugin uitgevoerd.

## Random giveaway

```txt
/storegui
→ Random giveaway
→ kies online speler
→ willekeurig product wordt gekozen
→ product wordt gratis geleverd
```

De giveaway gebruikt alle actieve producten uit `/api/products`.

---

# 12. Producten beheren

Bestand:

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

Placeholder:

```txt
{player}
```

Voorbeelden commands:

```txt
lp user {player} parent add vip
moneymanager add {player} 10000
shardmanager add {player} 500
broadcast &a{player} heeft een aankoop gedaan!
```

DonutCrates tijdelijk uitgeschakeld:

```txt
keymanager give {player} common 1
```

Zet dit pas terug als de licentie en server-IP weer werken.

---

# 13. Huidige product-ID's

```txt
vip
elite
legend
coins_10k
coins_50k
shards_500
shards_1500
starter_bundle
mega_bundle
live_test_bundle
```

`live_test_bundle` is nu de Dynathi Ultimate Bundle van €29,99.

---

# 14. PowerShell scripts

## 14.1 Algemene store-test

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
Stripe-status
orderstatus
```

## 14.2 DB-testorder

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-db-order.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi" `
  -ProductId "coins_10k"
```

Deze test slaat Stripe over en maakt direct een order in MySQL.

## 14.3 Random giveaway

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\random-giveaway.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi"
```

Dry-run:

```powershell
-DryRun
```

Producten uitsluiten:

```powershell
-ExcludeProductIds "legend","mega_bundle"
```

---

# 15. Discordmeldingen

Discord ontvangt onder andere:

```txt
Checkout gestart
Betaling gelukt
Order in wachtrij
Order geleverd
Order mislukt
Betaalde order hersteld
Gift-order aangemaakt
Random giveaway
Webhookfout
```

Vercel variable:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
```

---

# 16. Handmatige commandtests

Test altijd eerst in de serverconsole:

```txt
moneymanager add dynathi 10000
shardmanager add dynathi 500
lp user dynathi parent add vip
broadcast &aTestbericht
```

DonutCrates later testen met:

```txt
keymanager give dynathi common 1
```

---

# 17. Troubleshooting

## Betaling paid, maar geen order

```txt
Betaling: paid
Orderstatus: leeg
```

Controleer:

```txt
Stripe webhook logs
Vercel logs
STRIPE_WEBHOOK_SECRET
webhook events
live/test mode
```

Open de successpagina opnieuw; `sync-paid-order` probeert de order te herstellen.

## Order blijft pending_delivery

```txt
/storebridge status
/storebridge check
```

Controleer:

```txt
api-url
api-secret
serverinternet
Vercel bereikbaarheid
```

## HTTP 401

De secrets verschillen.

Controleer:

```txt
Vercel PLUGIN_SECRET
plugin config api-secret
```

Daarna:

```txt
/storebridge reload
```

## Order failed

Controleer serverconsole en Discord.

Voer het mislukte command handmatig uit.

## Producten niet zichtbaar

```txt
Vercel redeploy
Ctrl+F5 in browser
/storebridge reload
```

## PowerShell blokkeert script

```powershell
powershell.exe -ExecutionPolicy Bypass -File ".\script.ps1"
```

of:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## MySQL fout

Controleer:

```txt
externe host
poort 3306
gebruikersnaam
wachtwoord
database naam
MYSQL_SSL
```

---

# 18. Veiligheid

Nooit openbaar delen:

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PLUGIN_SECRET
MYSQL_PASSWORD
DISCORD_WEBHOOK_URL
```

Gebruik geen root-account voor MySQL.

Gebruik een lange `PLUGIN_SECRET`.

Verander secrets direct bij vermoeden van lekkage.

---

# 19. Updateprocedure

## Website/backend

```txt
GitHub commit
→ Vercel redeploy
→ browser testen
→ Stripe test
→ plugin ordercheck
```

## Plugin

```powershell
cd paper-plugin
mvn clean package
```

Daarna:

```txt
server stoppen
oude JAR verwijderen
nieuwe JAR uploaden
server volledig starten
/storebridge status
/buy
/storegui
```

---

# 20. Productiechecklist

```txt
[ ] Vercel deploy succesvol
[ ] /api/products werkt
[ ] Stripe live key actief
[ ] live webhook secret ingesteld
[ ] webhook events geselecteerd
[ ] MySQL extern bereikbaar
[ ] PLUGIN_SECRET gelijk aan api-secret
[ ] Discord webhook werkt
[ ] /buy opent GUI
[ ] /webshop opent GUI
[ ] /storegui opent admin GUI
[ ] DB-testorder wordt delivered
[ ] echte betaling wordt delivered
[ ] giveaway werkt
[ ] DonutCrates commands uitgeschakeld zolang licentie ontbreekt
```

---

# 21. Belangrijkste URLs

```txt
Website:
https://minecraft-shop-iota.vercel.app

Producten API:
https://minecraft-shop-iota.vercel.app/api/products

Stripe webhook:
https://minecraft-shop-iota.vercel.app/api/stripe-webhook

Orderstatus:
https://minecraft-shop-iota.vercel.app/api/order-status?session_id=cs_live_...
```

---

# 22. Snelle commandkaart

```txt
Spelers:
/buy
/webshop

Admins:
/storegui
/storebridge status
/storebridge reload
/storebridge check

LuckPerms:
/lp group default permission set dynathistore.shop true
/lp group admin permission set dynathistore.gui true
/lp group admin permission set dynathistore.admin true

Tests:
moneymanager add dynathi 10000
shardmanager add dynathi 500
lp user dynathi parent add vip
```
