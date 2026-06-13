# Beveiliging en onderhoud

## Geheime gegevens

Deze waarden mogen nooit in GitHub, screenshots of Discord worden geplaatst:

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PLUGIN_SECRET
MYSQL_PASSWORD
DISCORD_WEBHOOK_URL
```

Bewaar ze alleen in Vercel Environment Variables en de lokale pluginconfig.

## Plugin secret

Gebruik een lange willekeurige waarde van minimaal 40 tekens. De waarde moet exact hetzelfde zijn in:

```txt
Vercel: PLUGIN_SECRET
Paper-plugin: api-secret
```

Verander de secret direct wanneer je vermoedt dat hij is gelekt.

## Stripe

- Gebruik aparte test- en live-webhooks.
- Controleer webhookhandtekeningen altijd.
- Vertrouw nooit alleen op de browserredirect na betaling.
- Lever alleen wanneer Stripe `payment_status=paid` teruggeeft.

## Database

- Gebruik geen root-account.
- Geef alleen noodzakelijke rechten.
- Maak regelmatig backups.
- Beperk externe toegang waar mogelijk.

## Giveaways en testorders

De PowerShell-scripts gebruiken beveiligde API-routes. Deel het script gerust, maar vul de echte `PLUGIN_SECRET` alleen lokaal in bij het uitvoeren.

## Updates

Na backendwijzigingen:

```txt
Vercel redeploy
```

Na pluginwijzigingen:

```txt
mvn clean package
server stoppen
oude JAR vervangen
server volledig starten
```

## Controlelijst voor productie

```txt
[ ] Stripe live key actief
[ ] live webhook secret ingesteld
[ ] juiste webhookevents geselecteerd
[ ] MySQL extern bereikbaar
[ ] plugin secret komt exact overeen
[ ] Discord webhook werkt
[ ] DB-testorder geleverd
[ ] echte betaling eindigt op delivered
[ ] crate commands alleen actief wanneer DonutCrates werkt
```
