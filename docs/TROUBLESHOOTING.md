# Problemen oplossen

## Betaling is `paid`, maar geen order in MySQL

Symptoom:

```txt
Betaling: paid
Levering: Nog niet verwerkt
```

Mogelijke oorzaak:

```txt
Stripe webhook niet ontvangen
verkeerde webhook secret
live en test keys door elkaar
webhook event niet geselecteerd
```

Controleer:

```txt
Stripe Dashboard → Developers → Webhooks → Events
Vercel → Project → Logs
```

De succespagina probeert via `/api/sync-paid-order` een betaalde sessie automatisch te herstellen.

## Order blijft `pending_delivery`

Controleer:

```txt
/storbridge status
/storebridge check
```

Controleer ook:

```txt
api-url
api-secret
internetverbinding van de server
Vercel logs
```

## HTTP 401 bij plugin-endpoints

`PLUGIN_SECRET` in Vercel is niet exact gelijk aan `api-secret` in de pluginconfig.

Na aanpassen:

```txt
/storebridge reload
```

## Order wordt `failed`

Controleer welk command mislukte in:

```txt
serverconsole
Discord orderkanaal
/storegui
```

Voer het command handmatig uit om de precieze pluginfout te zien.

## DonutCrates / keymanager werkt niet

Crate-keycommands zijn momenteel uitgeschakeld. Zet ze pas terug wanneer de DonutCrates-licentie en server-IP weer geldig zijn.

Test daarna eerst handmatig:

```txt
keymanager give dynathi common 1
```

## PowerShell script is niet digitaal ondertekend

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass -File ".\script.ps1"
```

## Producten verschijnen niet na wijziging

Redeploy Vercel en vernieuw daarna de browser met Ctrl+F5.

## MySQL fout

Controleer:

```txt
MYSQL_HOST is geen localhost
poort is correct
externe verbindingen zijn toegestaan
gebruikersnaam en wachtwoord kloppen
MYSQL_SSL past bij de host
```
