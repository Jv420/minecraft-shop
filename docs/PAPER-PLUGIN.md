# Paper-plugin

## Vereisten

```txt
Paper 1.21.11
Java 21
Maven 3.9+
```

## Bouwen

```powershell
cd paper-plugin
mvn clean package
```

Gebruik de JAR uit:

```txt
paper-plugin/target/
```

Upload deze naar:

```txt
plugins/
```

## Configuratie

Bestand:

```txt
plugins/DynathiStoreBridge/config.yml
```

Voorbeeld:

```yaml
api-url: "https://minecraft-shop-iota.vercel.app"
api-secret: "DEZELFDE_WAARDE_ALS_PLUGIN_SECRET"
check-interval-seconds: 10
request-timeout-seconds: 15

logging:
  commands: true
  responses: true
```

## Commands

```txt
/storebridge status
/storebridge reload
/storebridge check
/storegui
```

## Permissions

```txt
dynathistore.admin
dynathistore.gui
```

## Werking

De plugin haalt orders op via:

```txt
/api/plugin/orders
```

Na uitvoering meldt hij de status terug via:

```txt
/api/plugin/complete
```

## In-game beheer

Met `/storegui` kun je recente orders bekijken, gift-orders aanmaken en sommige orders opnieuw proberen.

Gebruik retries voorzichtig om dubbele levering te voorkomen.
