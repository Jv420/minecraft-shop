# Externe marketplace-aankopen: BuiltByBit en CodeCanyon

Deze flow is bedoeld voor klanten die de plugin of webshop kopen via externe platforms zoals BuiltByBit of CodeCanyon.

## Aanbevolen flow

```txt
Klant koopt product op BuiltByBit of CodeCanyon
→ klant joint jouw Discord-server
→ klant gebruikt /license-request
→ klant kiest marketplace
→ klant vult aankoopcode/order-ID in
→ bot controleert aankoop via API of handmatige staffcontrole
→ aanvraag krijgt status pending
→ staff keurt aanvraag goed
→ licentiecode wordt aangemaakt
→ bot stuurt code via DM
```

## Ondersteunde bronnen

```txt
stripe
builtbybit
codecanyon
manual
```

## Velden per aanvraag

```txt
marketplace
purchase_code
order_id
product
customer_name
email
discord_user_id
instance_id
status
license_key
verified_at
approved_at
```

## BuiltByBit

Gebruik bij voorkeur de officiële resource/purchase-verificatiemogelijkheid van BuiltByBit wanneer die beschikbaar is voor jouw verkopersaccount.

Benodigde gegevens kunnen zijn:

```txt
BuiltByBit user ID
order ID
resource ID
purchase token
```

Environment variables:

```env
BUILTBYBIT_API_KEY=...
BUILTBYBIT_RESOURCE_ID=...
```

## CodeCanyon / Envato

CodeCanyon gebruikt Envato purchase codes.

De klant levert bijvoorbeeld:

```txt
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

De licentieserver controleert de code via de Envato API.

Environment variables:

```env
ENVATO_PERSONAL_TOKEN=...
ENVATO_ITEM_ID=...
```

Controleer minimaal:

```txt
purchase code bestaat
item ID komt overeen
license type is toegestaan
purchase is niet refunded/revoked
purchase code is nog niet gebruikt
```

## Discord slash command

```txt
/license-request marketplace:<stripe|builtbybit|codecanyon> product:<web|plugin|bundle> purchase-code:<code> instance-id:<id>
```

Voorbeeld BuiltByBit:

```txt
/license-request marketplace:builtbybit product:plugin purchase-code:ORDER-12345 instance-id:play.example.com
```

Voorbeeld CodeCanyon:

```txt
/license-request marketplace:codecanyon product:bundle purchase-code:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx instance-id:shop.example.com
```

## Staffcommando's

```txt
/license-requests
/license-approve request-id:<id>
/license-reject request-id:<id> reason:<reden>
/license-info license-key:<code>
/license-reset license-key:<code>
/license-revoke license-key:<code>
```

## Automatisch versus handmatig

### Automatisch

De bot controleert direct bij de marketplace-API en geeft bij geldige betaling automatisch een licentie uit.

Voordelen:

```txt
sneller
minder handwerk
24/7 beschikbaar
```

Nadelen:

```txt
API-tokens nodig
platformwijzigingen kunnen integratie breken
meer beveiliging nodig
```

### Handmatig

De bot maakt een aanvraag en staff controleert de aankoop in het marketplace-dashboard.

Voordelen:

```txt
eenvoudiger
minder API-afhankelijkheid
meer controle
```

Nadelen:

```txt
langzamer
staff moet online zijn
```

## Aanbevolen hybride aanpak

```txt
Stripe: automatisch verifiëren
CodeCanyon: automatisch via Envato API
BuiltByBit: automatisch wanneer officiële API beschikbaar is, anders handmatig
onbekende bron: handmatige staffcontrole
```

## Anti-misbruik

```txt
één purchase code mag maar één licentieaanvraag opleveren
bind code aan Discord user ID
bind licentie aan instance ID
log IP, tijd en marketplace
beperk activaties
blokkeer refunded/revoked purchases
rate-limit aanvragen
DM licentiecodes alleen aan de aanvrager
```

## Database-uitbreiding

Voeg aan `license_requests` toe:

```sql
marketplace VARCHAR(40) NOT NULL,
purchase_code VARCHAR(255) NOT NULL,
external_order_id VARCHAR(255) NULL,
external_item_id VARCHAR(255) NULL,
verified TINYINT(1) NOT NULL DEFAULT 0,
verification_payload JSON NULL,
UNIQUE KEY unique_marketplace_purchase (marketplace, purchase_code)
```

## Belangrijk

Sla API-tokens alleen op in de private licentieserver en nooit in de verkoopbare plugin of webshopbroncode.
