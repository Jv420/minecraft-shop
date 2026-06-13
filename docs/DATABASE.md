# MySQL en orderstatussen

## Verbinding

Vercel moet jouw database extern kunnen bereiken. Gebruik geen `localhost` of `127.0.0.1`.

Benodigde variabelen:

```env
MYSQL_HOST=jouw-host
MYSQL_PORT=3306
MYSQL_USER=jouw-user
MYSQL_PASSWORD=jouw-wachtwoord
MYSQL_DATABASE=jouw-database
MYSQL_SSL=false
```

## Tabel

De applicatie maakt automatisch de ordertabel aan:

```txt
minecraft_shop_orders
```

Belangrijke velden:

```txt
id
payment_intent_id
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

## Statussen

```txt
pending_delivery  order wacht op de plugin
processing        plugin heeft de order geclaimd
delivered         alle commands uitgevoerd
failed            levering mislukt
```

## Handmatige DB-test

Gebruik:

```powershell
powershell.exe -ExecutionPolicy Bypass `
  -File ".\scripts\test-db-order.ps1" `
  -StoreUrl "https://minecraft-shop-iota.vercel.app" `
  -PluginSecret "JOUW_PLUGIN_SECRET" `
  -Player "dynathi" `
  -ProductId "live_test_bundle"
```

## Let op bij retries

Voer een retry niet blind uit op een order met status `processing`. Mogelijk zijn enkele commands al uitgevoerd. Controleer eerst serverlogs en Discordmeldingen om dubbele coins, shards of ranks te voorkomen.
