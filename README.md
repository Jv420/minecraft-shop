# DynathiSMP Minecraft Store

Volledige Minecraft webshop voor DynathiSMP met Stripe, Discord, MySQL en automatische levering via een Paper-plugin.

## Wat dit project doet

1. Een speler kiest een product in de webshop.
2. Stripe verwerkt de betaling via iDEAL, kaart of Bancontact.
3. De Stripe webhook schrijft de betaalde order naar MySQL.
4. De Paper-plugin `DynathiStoreBridge` haalt nieuwe orders op.
5. De plugin voert de consolecommands lokaal op de Minecraft-server uit.
6. De plugin meldt `delivered` of `failed` terug.
7. Discord ontvangt meldingen over betaling en levering.

## Vereisten

- Paper 1.21.11
- Java 21
- Een werkende Stripe-account
- Een Discord webhook
- Een MySQL-database die extern bereikbaar is vanaf Vercel
- Een Vercel-account
- Maven 3.9 of nieuwer om de plugin te bouwen

## Projectstructuur

```txt
api/
  create-checkout-session.js
  stripe-webhook.js
  products.js
  plugin/
    orders.js
    complete.js
lib/
  db.js
  orders.js
  products.js
  discord.js
public/
  index.html
  style.css
  success.html
  cancel.html
paper-plugin/
  pom.xml
  src/main/java/nl/dynathi/store/DynathiStoreBridge.java
  src/main/resources/plugin.yml
  src/main/resources/config.yml
```

# Deel 1 — Repository naar Vercel deployen

## 1. Open Vercel

Ga naar Vercel en log in met GitHub.

Klik op:

```txt
Add New
→ Project
```

Importeer:

```txt
Jv420/minecraft-shop
```

## 2. Projectinstellingen

Gebruik deze instellingen:

```txt
Framework Preset: Other
Root Directory: ./
Build Command: leeg laten
Output Directory: public
Install Command: npm install
```

Als Vercel de map `public` automatisch herkent, hoef je Output Directory niet handmatig in te stellen.

## 3. Environment Variables toevoegen

Ga in Vercel naar:

```txt
Project
→ Settings
→ Environment Variables
```

Voeg deze variabelen toe voor Production, Preview en Development:

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
STORE_URL=https://jouw-project.vercel.app

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/xxxx

PLUGIN_SECRET=een-zeer-lange-willekeurige-geheime-sleutel

MYSQL_HOST=jouw-mysql-host
MYSQL_PORT=3306
MYSQL_USER=jouw-mysql-gebruiker
MYSQL_PASSWORD=jouw-mysql-wachtwoord
MYSQL_DATABASE=jouw-database
MYSQL_SSL=false
```

Gebruik voor `PLUGIN_SECRET` bijvoorbeeld een lange willekeurige waarde van minimaal 40 tekens.

Voorbeeld:

```txt
DynathiStore-7yQ9!m2L#8xP4vZ1cR6kT0sW3nH5
```

Sla deze secret veilig op. Dezelfde waarde moet later in de pluginconfig komen.

## 4. Eerste deployment

Klik op:

```txt
Deploy
```

Na deployment krijg je een URL zoals:

```txt
https://minecraft-shop.vercel.app
```

Zet daarna in Vercel:

```env
STORE_URL=https://minecraft-shop.vercel.app
```

Redeploy daarna het project.

# Deel 2 — MySQL configureren

## 1. Controleer externe toegang

Vercel moet jouw MySQL-host kunnen bereiken.

Vraag bij mcsh.io of controleer in het paneel of externe MySQL-verbindingen zijn toegestaan.

Je hebt nodig:

```txt
Host
Port
Database
Username
Password
```

Een host als `127.0.0.1` of `localhost` werkt niet vanuit Vercel.

Je hebt een externe hostnaam nodig, bijvoorbeeld:

```txt
mysql.mcsh.io
```

## 2. Databasegebruiker beperken

Gebruik bij voorkeur een aparte databasegebruiker voor de webshop.

Deze gebruiker heeft alleen nodig:

```txt
SELECT
INSERT
UPDATE
CREATE
INDEX
```

Gebruik niet de rootgebruiker.

## 3. Automatische tabelaanmaak

De webshop maakt automatisch deze tabel aan bij de eerste order/API-call:

```txt
minecraft_shop_orders
```

De tabel bevat onder andere:

```txt
id
player
product_id
product_name
amount
currency
commands_json
status
message
created_at
updated_at
```

Mogelijke statussen:

```txt
pending_delivery
processing
delivered
failed
```

## 4. MySQL SSL

Gebruik:

```env
MYSQL_SSL=false
```

als jouw host geen SSL vereist.

Gebruik:

```env
MYSQL_SSL=true
```

als mcsh.io SSL verplicht.

# Deel 3 — Stripe live instellen

## 1. Gebruik eerst testmodus

Zet eerst in Vercel:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxx
```

Gebruik pas live keys nadat een volledige testbetaling goed is verlopen.

## 2. Stripe webhook maken

Ga in Stripe naar:

```txt
Developers
→ Webhooks
→ Add endpoint
```

Gebruik als endpoint:

```txt
https://jouw-project.vercel.app/api/stripe-webhook
```

Selecteer deze events:

```txt
checkout.session.completed
checkout.session.expired
```

Klik op Create endpoint.

Kopieer daarna de Signing Secret:

```txt
whsec_xxxxxxxxxxxxxxxxx
```

Zet die in Vercel:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

Redeploy het project.

## 3. Live modus activeren

Na succesvolle tests:

1. Zet Stripe Dashboard op Live mode.
2. Maak opnieuw een live webhook aan.
3. Gebruik de live webhook secret.
4. Vervang `sk_test_...` door `sk_live_...`.
5. Redeploy Vercel.

Gebruik nooit een test webhook secret bij een live secret key.

# Deel 4 — Discord webhook instellen

Maak in Discord een webhook aan in een staff- of orderkanaal.

Ga naar:

```txt
Kanaalinstellingen
→ Integraties
→ Webhooks
→ Nieuwe webhook
```

Kopieer de webhook URL en zet die in Vercel:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxx/xxxx
```

Discord ontvangt meldingen voor:

```txt
Checkout gestart
Betaling gelukt
Checkout verlopen
Product geleverd
Delivery mislukt
```

Deel de webhook URL nooit openbaar.

# Deel 5 — Paper-plugin bouwen

## 1. Vereisten op je pc

Installeer:

```txt
Java 21 JDK
Maven 3.9+
Git
```

Controleer Java:

```bash
java -version
```

Dit moet Java 21 tonen.

Controleer Maven:

```bash
mvn -version
```

## 2. Repository downloaden

```bash
git clone https://github.com/Jv420/minecraft-shop.git
cd minecraft-shop/paper-plugin
```

## 3. Plugin bouwen

```bash
mvn clean package
```

De JAR staat daarna in:

```txt
paper-plugin/target/dynathi-store-bridge-1.0.0.jar
```

Als Maven ook een `original-...jar` maakt, gebruik dan de JAR zonder `original-` in de naam.

# Deel 6 — Plugin installeren op mcsh.io

## 1. Server stoppen

Stop eerst de Paper-server via het mcsh.io-paneel.

## 2. JAR uploaden

Upload:

```txt
dynathi-store-bridge-1.0.0.jar
```

naar:

```txt
plugins/
```

## 3. Server starten

Start de server één keer.

De plugin maakt deze map aan:

```txt
plugins/DynathiStoreBridge/
```

Daarin staat:

```txt
config.yml
```

## 4. Pluginconfig invullen

Open:

```txt
plugins/DynathiStoreBridge/config.yml
```

Gebruik:

```yaml
api-url: "https://jouw-project.vercel.app"
api-secret: "dezelfde-waarde-als-PLUGIN_SECRET-in-vercel"
check-interval-seconds: 10
request-timeout-seconds: 15

logging:
  commands: true
  responses: true
```

Belangrijk:

- Geen slash achter `api-url`.
- `api-secret` moet exact gelijk zijn aan `PLUGIN_SECRET` in Vercel.
- Gebruik HTTPS.

## 5. Config herladen

Voer in de console of in-game als operator uit:

```txt
/storebridge reload
```

Controleer daarna:

```txt
/storebridge status
```

Handmatig orders ophalen:

```txt
/storebridge check
```

Permissie:

```txt
dynathistore.admin
```

LuckPerms voorbeeld:

```txt
lp group owner permission set dynathistore.admin true
```

# Deel 7 — Productcommands configureren

Alle producten staan in:

```txt
lib/products.js
```

De plugin voert commands uit als consolecommand zonder `/`.

Correct:

```txt
moneymanager add {player} 10000
```

Niet correct:

```txt
/moneymanager add {player} 10000
```

## Geld

```txt
moneymanager add {player} 10000
```

## Shards

```txt
shardmanager add {player} 500
```

## Crate keys

```txt
keymanager give {player} common 3
keymanager give {player} gold 3
keymanager give {player} crimson 3
keymanager give {player} amethyst 3
keymanager give {player} prime 3
```

## Ranks

```txt
lp user {player} parent add vip
lp user {player} parent add elite
lp user {player} parent add legend
```

Nieuwe rank toevoegen:

```js
mythic: {
  id: 'mythic',
  name: 'Mythic Rank',
  category: 'Ranks',
  price: 3999,
  currency: 'eur',
  description: 'Mythic rank met exclusieve voordelen.',
  commands: [
    'lp user {player} parent add mythic',
    'moneymanager add {player} 150000',
    'keymanager give {player} prime 5'
  ]
}
```

Prijzen staan in eurocenten:

```txt
499 = €4,99
999 = €9,99
1999 = €19,99
```

# Deel 8 — Volledige testprocedure

Gebruik eerst Stripe testmodus.

## 1. Controleer de webshop

Open:

```txt
https://jouw-project.vercel.app
```

Controleer of producten zichtbaar zijn.

## 2. Controleer de plugin

```txt
/storebridge status
```

De API-URL en het interval moeten correct worden getoond.

## 3. Doe een testbetaling

Gebruik een Stripe testkaart:

```txt
4242 4242 4242 4242
```

Gebruik een toekomstige vervaldatum en willekeurige CVC.

## 4. Controleer de flow

De verwachte volgorde is:

```txt
Checkout gestart
→ Stripe betaling gelukt
→ MySQL order pending_delivery
→ plugin haalt order op
→ status processing
→ consolecommands uitgevoerd
→ status delivered
→ Discord melding Product geleverd
```

## 5. Controleer MySQL

Voer uit:

```sql
SELECT id, player, product_name, status, message, created_at
FROM minecraft_shop_orders
ORDER BY created_at DESC;
```

De uiteindelijke status moet zijn:

```txt
delivered
```

# Deel 9 — Live zetten

Zet de shop pas live als deze tests slagen:

- Testbetaling verschijnt in Stripe.
- Order wordt in MySQL opgeslagen.
- Plugin haalt de order op.
- Coins worden geleverd.
- Shards worden geleverd.
- Elke crate levert het juiste crate-type.
- LuckPerms-rank wordt correct gegeven.
- Discord ontvangt alle statussen.
- Dezelfde Stripe webhook levert niet dubbel.

Daarna:

1. Gebruik `sk_live_...`.
2. Maak een live Stripe webhook.
3. Zet de live `whsec_...` in Vercel.
4. Redeploy.
5. Doe een kleine echte betaling.
6. Controleer Stripe, MySQL, Minecraft en Discord.

# Deel 10 — Problemen oplossen

## Webshop toont geen producten

Open:

```txt
https://jouw-project.vercel.app/api/products
```

Je moet JSON met producten zien.

## Checkout geeft een fout

Controleer:

```txt
STRIPE_SECRET_KEY
STORE_URL
Vercel Function Logs
```

## Stripe webhook geeft 400

Controleer:

```txt
STRIPE_WEBHOOK_SECRET
Webhook endpoint URL
Test/live modus
```

Een test webhook secret werkt niet met live events.

## MySQL verbinding mislukt

Controleer:

```txt
MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE
MYSQL_SSL
```

Controleer ook of externe verbindingen zijn toegestaan.

## Plugin krijgt 401 Unauthorized

`PLUGIN_SECRET` in Vercel en `api-secret` in de pluginconfig zijn niet gelijk.

## Plugin krijgt geen orders

Controleer:

```txt
/storebridge status
/storebridge check
```

Bekijk ook de serverconsole en Vercel Function Logs.

## Order blijft op processing staan

Dit kan gebeuren als de server stopt nadat de order is geclaimd maar vóór afronding.

Controleer de order in MySQL. Zet hem alleen handmatig terug als je zeker weet dat het product niet geleverd is:

```sql
UPDATE minecraft_shop_orders
SET status = 'pending_delivery', claimed_at = NULL
WHERE id = 'STRIPE_SESSION_ID'
  AND status = 'processing';
```

Pas op: een order opnieuw aanbieden kan dubbele levering veroorzaken als de commands al deels uitgevoerd waren.

## Product is betaald maar niet geleverd

Controleer:

1. Discord foutmelding.
2. Minecraft console.
3. `message` in MySQL.
4. Of het command handmatig werkt.
5. Of de spelernaam correct is ingevoerd.

# Beveiliging

- Zet nooit secrets in GitHub.
- Deel je Stripe secret key niet.
- Deel je Discord webhook niet.
- Gebruik een aparte MySQL-gebruiker.
- Gebruik een lange `PLUGIN_SECRET`.
- Accepteer alleen HTTPS voor de plugin-API.
- Houd Paper en Java 21 bijgewerkt.
- Maak regelmatig databaseback-ups.

# Belangrijke bestanden

Producten en prijzen:

```txt
lib/products.js
```

Vercel databaseconfig:

```txt
lib/db.js
```

Stripe webhook:

```txt
api/stripe-webhook.js
```

Paper-pluginconfig:

```txt
plugins/DynathiStoreBridge/config.yml
```

# Huidige deliverycommands

```txt
moneymanager add {player} <amount>
shardmanager add {player} <amount>
keymanager give {player} <crate-type> <amount>
lp user {player} parent add <rank>
```

Ondersteunde crate-types in de huidige productconfig:

```txt
common
gold
crimson
amethyst
prime
```
