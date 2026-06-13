# Dynathi License Server

Privé licentieserver voor DynathiStore Web en DynathiStoreBridge.

## Belangrijk

Deze map is een voorbeeldimplementatie. Zet hem bij voorkeur in een aparte privé repository voordat je hem commercieel gebruikt.

## Functies

- licenties aanmaken
- licenties intrekken
- activaties per instance bijhouden
- maximaal aantal activaties
- vervaldatum
- productkoppeling
- Discord webhookmeldingen
- Discord botcommando's via slash commands
- signed license responses met RSA

## Environment variables

```env
PORT=3000
ADMIN_SECRET=een-zeer-lange-admin-secret
DATABASE_URL=mysql://user:password@host:3306/licenses
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
DISCORD_BOT_TOKEN=...
DISCORD_APPLICATION_ID=...
DISCORD_GUILD_ID=...
LICENSE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Starten

```powershell
cd license-server
npm install
npm start
```

## Belangrijkste endpoints

```txt
POST /api/licenses/verify
POST /api/admin/licenses
POST /api/admin/licenses/revoke
GET  /api/admin/licenses
GET  /health
```

## Discord slash commands

```txt
/license-create
/license-revoke
/license-info
/license-list
```
