# Stripe configuratie

## Checkout

De webshop maakt Checkout Sessions aan via:

```txt
/api/create-checkout-session
```

Ondersteunde betaalmethoden:

```txt
kaart
iDEAL
Bancontact
```

## Webhook

Endpoint:

```txt
https://minecraft-shop-iota.vercel.app/api/stripe-webhook
```

Activeer:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
```

## Test en live

Testmodus:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Livemodus:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Gebruik nooit een test webhook secret met een live secret key.

## Succesflow

```txt
Stripe betaling paid
→ webhook maakt MySQL-order
→ succespagina volgt status
→ Paper-plugin levert product
```

## Automatisch herstel

Wanneer Stripe `paid` toont maar geen MySQL-order bestaat, gebruikt de succespagina:

```txt
/api/sync-paid-order
```

Deze route haalt de Stripe-sessie opnieuw op, controleert `payment_status` en maakt daarna veilig een order aan.

## Bestaande sessie controleren

```txt
/api/order-status?session_id=cs_live_...
```

## Belangrijk

- Testkaart `4242 4242 4242 4242` werkt alleen in testmodus.
- Een `paid` Stripe-sessie is nog niet hetzelfde als een `delivered` Minecraft-order.
- Controleer Stripe webhook logs wanneer een order niet in MySQL verschijnt.
