# DynathiSMP Minecraft Store

Premium Minecraft webshop voor DynathiSMP.

## Features

- Stripe Checkout (iDEAL, Card, Bancontact)
- Discord webhook logging
- LuckPerms rank delivery
- Cuy / DonutCore coins
- Cuy / DonutCore shards
- DonutCrates keys
- RCON delivery agent
- Vercel hosting

## Installatie

### 1. Deploy naar Vercel

Importeer deze repository in Vercel.

Voeg alle variabelen uit `.env.example` toe onder Settings -> Environment Variables.

### 2. Stripe Webhook

Webhook URL:

/api/stripe-webhook

Events:
- checkout.session.completed
- checkout.session.expired

### 3. Minecraft RCON

server.properties

enable-rcon=true
rcon.port=25575
rcon.password=STERK_WACHTWOORD

### 4. RCON Agent

cd rcon-agent
npm install
node server.js

### Producten

Alle producten staan in:

lib/products.js

Voeg hier nieuwe ranks, coins, shards, keys of bundels toe.

## DynathiSMP

Aanbevolen categorieën:

- VIP
- Elite
- Legend
- Mythic
- Coins
- Shards
- Crate Keys
- Bundels
