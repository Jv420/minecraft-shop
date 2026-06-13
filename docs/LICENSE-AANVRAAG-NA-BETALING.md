# Licentiecode aanvragen na betaling

Deze flow is bedoeld voor verkoop van de DynathiStore-webshop en DynathiStoreBridge-plugin.

## Gewenste werking

```txt
Klant betaalt product
→ Stripe bevestigt betaling
→ klant krijgt licentie-aanvraagpagina
→ klant vult e-mail, Discord, domein/server-ID en ordernummer in
→ systeem controleert Stripe-betaling
→ aanvraag krijgt status pending
→ Discord ontvangt melding
→ beheerder keurt aanvraag goed
→ unieke licentiecode wordt aangemaakt
→ klant ontvangt code via e-mail of Discord
→ webshop/plugin activeert met die code
```

## Belangrijke velden

```txt
Stripe session ID
Stripe payment status
product
customer name
customer email
Discord user ID
instance ID
requested activations
status
license key
created at
approved at
```

## Aanvraagstatussen

```txt
pending
approved
rejected
issued
revoked
```

## Veiligheidsregels

- Alleen betaalde Stripe-sessies mogen een aanvraag starten.
- Eén Stripe-sessie mag maar één licentieaanvraag maken.
- Product uit Stripe metadata moet overeenkomen met het aangevraagde product.
- Licentiecode wordt pas uitgegeven na goedkeuring.
- Koppel activaties aan een domein, server-ID of beide.
- Deel nooit admin secrets of signing keys met klanten.

## Aanbevolen producten

```txt
DYNASTORE-WEB
DYNASTORE-PLUGIN
DYNASTORE-BUNDLE
```

## Discord beheerflow

```txt
/license-request-list
/license-request-approve request_id
/license-request-reject request_id
/license-info license_key
/license-reset license_key
/license-revoke license_key
```

## Klantflow

De klant opent na betaling:

```txt
/license-request.html?session_id=cs_live_...
```

Na verzenden ziet de klant:

```txt
Aanvraag ontvangen
Status: pending
Aanvraagnummer: LR-...
```

Na goedkeuring kan de licentie worden opgehaald via een beveiligde statuslink of handmatig via Discord/e-mail worden verstuurd.
