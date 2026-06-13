# Producten beheren

Alle webshopproducten staan in:

```txt
lib/products.js
```

## Productstructuur

```js
product_id: {
  id: 'product_id',
  name: 'Productnaam',
  category: 'Bundels',
  price: 2999,
  currency: 'eur',
  description: 'Beschrijving voor de webshop.',
  commands: [
    'moneymanager add {player} 10000',
    'shardmanager add {player} 100'
  ]
}
```

## Prijzen

Prijzen staan in eurocenten:

```txt
50   = €0,50
499  = €4,99
999  = €9,99
2999 = €29,99
```

## Placeholders

Gebruik:

```txt
{player}
```

De backend vervangt dit door de Minecraft-naam van de koper.

## Huidige productsoorten

```txt
Ranks
Coins
Shards
Bundels
```

Crate-keyproducten zijn tijdelijk uitgeschakeld totdat DonutCrates en `keymanager` weer correct werken.

## Product toevoegen

1. Voeg het product toe aan `lib/products.js`.
2. Controleer dat de commands handmatig in de serverconsole werken.
3. Commit de wijziging.
4. Redeploy Vercel.
5. Test eerst met `test-db-order.ps1`.

## Product uitschakelen

Verwijder het productobject uit `lib/products.js` of zet het tijdelijk in commentaar. Vergeet daarna de Vercel redeploy niet.

## Belangrijk

Wijzig de commands niet terwijl er nog openstaande orders voor dat product bestaan. Oude orders bewaren hun eigen commandlijst in MySQL, maar nieuwe orders gebruiken direct de actuele productconfiguratie.
