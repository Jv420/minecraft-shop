# Installatie en deployment

## 1. Repository importeren in Vercel

```txt
Vercel → Add New → Project
```

Importeer:

```txt
Jv420/minecraft-shop
```

Instellingen:

```txt
Framework Preset: Other
Root Directory: ./
Build Command: leeg
Output Directory: public
Install Command: npm install
```

## 2. Environment variables

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
STORE_URL=https://minecraft-shop-iota.vercel.app
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx
PLUGIN_SECRET=een-lange-willekeurige-geheime-sleutel
MYSQL_HOST=jouw-host
MYSQL_PORT=3306
MYSQL_USER=jouw-user
MYSQL_PASSWORD=jouw-wachtwoord
MYSQL_DATABASE=jouw-database
MYSQL_SSL=false
```

Gebruik dezelfde `PLUGIN_SECRET` in Vercel en in de pluginconfig.

## 3. Deployen

Na het toevoegen van alle variabelen:

```txt
Deployments → Redeploy
```

## 4. Controleren

Open:

```txt
https://minecraft-shop-iota.vercel.app
https://minecraft-shop-iota.vercel.app/api/products
```

De tweede URL moet een JSON-lijst met producten tonen.

## 5. Na wijzigingen

Wijzigingen in deze mappen vereisen een Vercel redeploy:

```txt
api/
lib/
public/
```

Wijzigingen in `paper-plugin/` vereisen een nieuwe Maven-build en een nieuwe JAR op de server.
