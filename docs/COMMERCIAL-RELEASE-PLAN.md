# Commercial Release Plan

Deze handleiding beschrijft hoe de huidige werkende Minecraft-webshop wordt omgezet naar een verkoopbare white-label oplossing.

## 1. Huidige productie veilig afsluiten

Voordat je de huidige Vercel deployment verwijdert:

```txt
[ ] exporteer Vercel Environment Variables
[ ] exporteer MySQL orders en licentieaanvragen
[ ] noteer Stripe webhook URL en signing secret
[ ] download de laatste werkende plugin-JAR
[ ] maak een GitHub tag of backup branch
[ ] bewaar screenshots van werkende GUI's en checkoutflow
```

Zet daarna Stripe webhooks tijdelijk uit of verwijder het oude endpoint, zodat Stripe niet naar een offline deployment blijft sturen.

## 2. Maak twee nieuwe repositories

Aanbevolen structuur:

```txt
PUBLIC/COMMERCIAL CLIENT REPO
minecraft-commerce-suite
- webshop
- Paper plugin
- docs
- voorbeelden
- geen secrets
- geen private signing keys

PRIVATE INFRA REPO
dynathi-license-platform
- licentieserver
- Discord bot
- marketplace API-integraties
- admin dashboard
- private signing key
- database migrations
```

## 3. White-label branding

Maak alle branding configureerbaar via environment variables en config.yml.

Voorbeeld webshop:

```env
STORE_BRAND_NAME=YourServer Store
STORE_BRAND_TAGLINE=Premium Minecraft Store
STORE_SUPPORT_URL=https://discord.gg/example
STORE_PRIMARY_DOMAIN=https://shop.example.com
```

Voorbeeld plugin:

```yaml
branding:
  name: "YourServer Store"
  command-prefix: "Store"
  support-url: "https://discord.gg/example"
```

Hardcode geen DynathiSMP-, VloeiNetwork- of persoonlijke gegevens in de commerciële build.

## 4. Licentiearchitectuur

De licentieserver moet privé blijven.

Verificatieflow:

```txt
client stuurt license key + product + instance ID
→ licentieserver controleert status, product, activaties en vervaldatum
→ server retourneert signed payload
→ client verifieert RSA/ECDSA signature met ingebouwde publieke sleutel
→ functionaliteit wordt toegestaan of geblokkeerd
```

Nooit naar clients sturen:

```txt
private signing key
admin secret
marketplace API-token
Discord bot token
licentiedatabase credentials
```

## 5. Aankoopbronnen

Ondersteun minimaal:

```txt
Stripe
BuiltByBit
CodeCanyon / Envato
manual
```

Iedere aankoopbron wordt vertaald naar één interne aankooprecord:

```txt
source
external_purchase_id
external_product_id
customer_identifier
verified
refunded
license_request_id
```

## 6. Discord aanvraagflow

```txt
/license-request
→ marketplace kiezen
→ aankoopcode/order-ID invullen
→ product kiezen
→ instance ID invullen
→ automatische of handmatige verificatie
→ pending aanvraag in staffkanaal
→ approve/reject buttons
→ licentiecode via DM
```

## 7. Database-entiteiten

Minimaal:

```txt
licenses
license_activations
license_requests
purchases
customers
audit_logs
```

## 8. Productveiligheid

Voor de webshop:

```txt
checkout creation licentiecheck
admin API licentiecheck
rate limiting
Stripe signature validation
input validation
idempotency per order
```

Voor de plugin:

```txt
signed license responses
periodieke controle
grace period bij storing
license status command
geen orderuitvoering bij definitief ongeldige licentie
```

## 9. Delivery en retries

Voorkom dubbele levering door per order en command een deliverylog bij te houden.

Aanbevolen tabel:

```txt
order_command_executions
- order_id
- command_index
- command_hash
- status
- executed_at
- result_message
```

Een retry voert alleen commands uit die nog niet succesvol zijn geregistreerd.

## 10. Verkoopbundel

Lever klanten:

```txt
plugin JAR
webshop ZIP of repository template
installatiehandleiding
config voorbeelden
changelog
licentiecode
supportlink
voorwaarden
```

Lever niet:

```txt
private licentieservercode
Discord bot source als die je beveiliging bevat
private keys
productie database dump
marketplace API tokens
```

## 11. Releaseversies

Gebruik semantic versioning:

```txt
1.0.0 eerste commerciële release
1.1.0 nieuwe features
1.1.1 bugfix
2.0.0 breaking changes
```

Houd plugin.yml, pom.xml, package.json en changelog gelijk.

## 12. Releasechecklist

```txt
[ ] neutrale branding
[ ] geen secrets in Git
[ ] signed licenties werken
[ ] Stripe testbetaling werkt
[ ] BuiltByBit flow getest
[ ] Envato flow getest
[ ] Discord bot approve/reject werkt
[ ] activatielimiet getest
[ ] revoke getest
[ ] grace period getest
[ ] database migrations getest
[ ] plugin compileert met Java 21
[ ] /buy en /webshop werken
[ ] /storegui werkt
[ ] gift en giveaway werken
[ ] retry veroorzaakt geen dubbele levering
[ ] documentatie compleet
[ ] support- en refundbeleid klaar
```
