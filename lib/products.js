const products = {
  vip: { id: 'vip', name: 'VIP Rank', category: 'Ranks', price: 499, currency: 'eur', description: 'VIP rank met extra homes, perks en supporter status.', commands: ['lp user {player} parent add vip', 'broadcast &a{player} heeft VIP gekocht in de webshop!'] },
  elite: { id: 'elite', name: 'Elite Rank', category: 'Ranks', price: 999, currency: 'eur', description: 'Elite rank met meer voordelen en coins. Crate keys zijn tijdelijk uitgeschakeld.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 25000', 'broadcast &b{player} heeft Elite gekocht!'] },
  legend: { id: 'legend', name: 'Legend Rank', category: 'Ranks', price: 1999, currency: 'eur', description: 'Legend rank met extra coins. Crate keys zijn tijdelijk uitgeschakeld.', commands: ['lp user {player} parent add legend', 'moneymanager add {player} 75000', 'broadcast &6{player} heeft Legend gekocht!'] },

  coins_10k: { id: 'coins_10k', name: '10.000 Coins', category: 'Coins', price: 299, currency: 'eur', description: 'Ontvang 10.000 coins.', commands: ['moneymanager add {player} 10000'] },
  coins_50k: { id: 'coins_50k', name: '50.000 Coins', category: 'Coins', price: 799, currency: 'eur', description: 'Ontvang 50.000 coins.', commands: ['moneymanager add {player} 50000'] },

  shards_500: { id: 'shards_500', name: '500 Shards', category: 'Shards', price: 399, currency: 'eur', description: 'Ontvang 500 shards.', commands: ['shardmanager add {player} 500'] },
  shards_1500: { id: 'shards_1500', name: '1.500 Shards', category: 'Shards', price: 899, currency: 'eur', description: 'Ontvang 1.500 shards.', commands: ['shardmanager add {player} 1500'] },

  starter_bundle: { id: 'starter_bundle', name: 'Starter Bundle', category: 'Bundels', price: 799, currency: 'eur', description: 'Coins en shards voor een sterke start. Crate keys zijn tijdelijk uitgeschakeld.', commands: ['moneymanager add {player} 25000', 'shardmanager add {player} 300', 'broadcast &a{player} heeft de Starter Bundle gekocht!'] },
  mega_bundle: { id: 'mega_bundle', name: 'Dynathi Mega Bundle', category: 'Bundels', price: 2499, currency: 'eur', description: 'Elite rank, veel coins en shards. Crate keys zijn tijdelijk uitgeschakeld.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 100000', 'shardmanager add {player} 1500', 'broadcast &d{player} heeft de Dynathi Mega Bundle gekocht!'] },
  live_test_bundle: { id: 'live_test_bundle', name: 'Dynathi Ultimate Bundle', category: 'Bundels', price: 2999, currency: 'eur', description: 'Complete bundel met 10.000 coins en 100 shards. Crate keys zijn tijdelijk uitgeschakeld.', commands: ['moneymanager add {player} 10000', 'shardmanager add {player} 100', 'broadcast &e{player} heeft de Dynathi Ultimate Bundle gekocht!'] }
};

module.exports = products;
