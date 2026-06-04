const products = {
  vip: { id: 'vip', name: 'VIP Rank', category: 'Ranks', price: 499, currency: 'eur', description: 'VIP rank met extra homes, perks en supporter status.', commands: ['lp user {player} parent add vip', 'broadcast &a{player} heeft VIP gekocht in de webshop!'] },
  elite: { id: 'elite', name: 'Elite Rank', category: 'Ranks', price: 999, currency: 'eur', description: 'Elite rank met meer voordelen, coins en keys.', commands: ['lp user {player} parent add elite', 'cuy coins give {player} 25000', 'donutcrates keys give {player} vote 3', 'broadcast &b{player} heeft Elite gekocht!'] },
  legend: { id: 'legend', name: 'Legend Rank', category: 'Ranks', price: 1999, currency: 'eur', description: 'Legend rank voor echte DynathiSMP supporters.', commands: ['lp user {player} parent add legend', 'cuy coins give {player} 75000', 'donutcrates keys give {player} legendary 2', 'broadcast &6{player} heeft Legend gekocht!'] },
  coins_10k: { id: 'coins_10k', name: '10.000 Coins', category: 'Coins', price: 299, currency: 'eur', description: 'Ontvang 10.000 Cuy/DonutCore coins.', commands: ['cuy coins give {player} 10000'] },
  coins_50k: { id: 'coins_50k', name: '50.000 Coins', category: 'Coins', price: 799, currency: 'eur', description: 'Ontvang 50.000 Cuy/DonutCore coins.', commands: ['cuy coins give {player} 50000'] },
  shards_500: { id: 'shards_500', name: '500 Shards', category: 'Shards', price: 399, currency: 'eur', description: 'Ontvang 500 Cuy/DonutCore shards.', commands: ['cuy shards give {player} 500'] },
  shards_1500: { id: 'shards_1500', name: '1.500 Shards', category: 'Shards', price: 899, currency: 'eur', description: 'Ontvang 1.500 Cuy/DonutCore shards.', commands: ['cuy shards give {player} 1500'] },
  basic_keys: { id: 'basic_keys', name: 'Basic Keys x5', category: 'Crate Keys', price: 349, currency: 'eur', description: '5 DonutCrates basic keys.', commands: ['donutcrates keys give {player} basic 5'] },
  legendary_keys: { id: 'legendary_keys', name: 'Legendary Keys x3', category: 'Crate Keys', price: 899, currency: 'eur', description: '3 DonutCrates legendary keys.', commands: ['donutcrates keys give {player} legendary 3'] },
  starter_bundle: { id: 'starter_bundle', name: 'Starter Bundle', category: 'Bundels', price: 799, currency: 'eur', description: 'Coins, shards en crate keys voor een sterke start.', commands: ['cuy coins give {player} 25000', 'cuy shards give {player} 300', 'donutcrates keys give {player} basic 5', 'broadcast &a{player} heeft de Starter Bundle gekocht!'] },
  mega_bundle: { id: 'mega_bundle', name: 'Dynathi Mega Bundle', category: 'Bundels', price: 2499, currency: 'eur', description: 'Elite rank, veel coins, shards en legendary keys.', commands: ['lp user {player} parent add elite', 'cuy coins give {player} 100000', 'cuy shards give {player} 1500', 'donutcrates keys give {player} legendary 3', 'broadcast &d{player} heeft de Dynathi Mega Bundle gekocht!'] }
};

module.exports = products;
