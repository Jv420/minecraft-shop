const products = {
  vip: { id: 'vip', name: 'VIP Rank', category: 'Ranks', price: 499, currency: 'eur', description: 'VIP rank met extra homes, perks en supporter status.', commands: ['lp user {player} parent add vip', 'broadcast &a{player} heeft VIP gekocht in de webshop!'] },
  elite: { id: 'elite', name: 'Elite Rank', category: 'Ranks', price: 999, currency: 'eur', description: 'Elite rank met meer voordelen, coins en keys.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 25000', 'keymanager give {player} common 3', 'broadcast &b{player} heeft Elite gekocht!'] },
  legend: { id: 'legend', name: 'Legend Rank', category: 'Ranks', price: 1999, currency: 'eur', description: 'Legend rank voor echte DynathiSMP supporters.', commands: ['lp user {player} parent add legend', 'moneymanager add {player} 75000', 'keymanager give {player} common 5', 'broadcast &6{player} heeft Legend gekocht!'] },
  coins_10k: { id: 'coins_10k', name: '10.000 Coins', category: 'Coins', price: 299, currency: 'eur', description: 'Ontvang 10.000 coins.', commands: ['moneymanager add {player} 10000'] },
  coins_50k: { id: 'coins_50k', name: '50.000 Coins', category: 'Coins', price: 799, currency: 'eur', description: 'Ontvang 50.000 coins.', commands: ['moneymanager add {player} 50000'] },
  shards_500: { id: 'shards_500', name: '500 Shards', category: 'Shards', price: 399, currency: 'eur', description: 'Ontvang 500 shards.', commands: ['shardmanager add {player} 500'] },
  shards_1500: { id: 'shards_1500', name: '1.500 Shards', category: 'Shards', price: 899, currency: 'eur', description: 'Ontvang 1.500 shards.', commands: ['shardmanager add {player} 1500'] },
  basic_keys: { id: 'basic_keys', name: 'Common Keys x5', category: 'Crate Keys', price: 349, currency: 'eur', description: 'Ontvang 5 common crate keys.', commands: ['keymanager give {player} common 5'] },
  legendary_keys: { id: 'legendary_keys', name: 'Common Keys x10', category: 'Crate Keys', price: 899, currency: 'eur', description: 'Ontvang 10 common crate keys.', commands: ['keymanager give {player} common 10'] },
  starter_bundle: { id: 'starter_bundle', name: 'Starter Bundle', category: 'Bundels', price: 799, currency: 'eur', description: 'Coins, shards en crate keys voor een sterke start.', commands: ['moneymanager add {player} 25000', 'shardmanager add {player} 300', 'keymanager give {player} common 5', 'broadcast &a{player} heeft de Starter Bundle gekocht!'] },
  mega_bundle: { id: 'mega_bundle', name: 'Dynathi Mega Bundle', category: 'Bundels', price: 2499, currency: 'eur', description: 'Elite rank, veel coins, shards en crate keys.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 100000', 'shardmanager add {player} 1500', 'keymanager give {player} common 10', 'broadcast &d{player} heeft de Dynathi Mega Bundle gekocht!'] }
};

module.exports = products;
