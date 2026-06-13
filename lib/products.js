const products = {
  vip: { id: 'vip', name: 'VIP Rank', category: 'Ranks', price: 499, currency: 'eur', description: 'VIP rank met extra homes, perks en supporter status.', commands: ['lp user {player} parent add vip', 'broadcast &a{player} heeft VIP gekocht in de webshop!'] },
  elite: { id: 'elite', name: 'Elite Rank', category: 'Ranks', price: 999, currency: 'eur', description: 'Elite rank met meer voordelen, coins en keys.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 25000', 'keymanager give {player} gold 3', 'broadcast &b{player} heeft Elite gekocht!'] },
  legend: { id: 'legend', name: 'Legend Rank', category: 'Ranks', price: 1999, currency: 'eur', description: 'Legend rank voor echte DynathiSMP supporters.', commands: ['lp user {player} parent add legend', 'moneymanager add {player} 75000', 'keymanager give {player} prime 2', 'broadcast &6{player} heeft Legend gekocht!'] },

  coins_10k: { id: 'coins_10k', name: '10.000 Coins', category: 'Coins', price: 299, currency: 'eur', description: 'Ontvang 10.000 coins.', commands: ['moneymanager add {player} 10000'] },
  coins_50k: { id: 'coins_50k', name: '50.000 Coins', category: 'Coins', price: 799, currency: 'eur', description: 'Ontvang 50.000 coins.', commands: ['moneymanager add {player} 50000'] },

  shards_500: { id: 'shards_500', name: '500 Shards', category: 'Shards', price: 399, currency: 'eur', description: 'Ontvang 500 shards.', commands: ['shardmanager add {player} 500'] },
  shards_1500: { id: 'shards_1500', name: '1.500 Shards', category: 'Shards', price: 899, currency: 'eur', description: 'Ontvang 1.500 shards.', commands: ['shardmanager add {player} 1500'] },

  common_keys_3: { id: 'common_keys_3', name: 'Common Keys x3', category: 'Crate Keys', price: 249, currency: 'eur', description: 'Ontvang 3 Common crate keys.', commands: ['keymanager give {player} common 3'] },
  gold_keys_3: { id: 'gold_keys_3', name: 'Gold Keys x3', category: 'Crate Keys', price: 449, currency: 'eur', description: 'Ontvang 3 Gold crate keys.', commands: ['keymanager give {player} gold 3'] },
  crimson_keys_3: { id: 'crimson_keys_3', name: 'Crimson Keys x3', category: 'Crate Keys', price: 649, currency: 'eur', description: 'Ontvang 3 Crimson crate keys.', commands: ['keymanager give {player} crimson 3'] },
  amethyst_keys_3: { id: 'amethyst_keys_3', name: 'Amethyst Keys x3', category: 'Crate Keys', price: 849, currency: 'eur', description: 'Ontvang 3 Amethyst crate keys.', commands: ['keymanager give {player} amethyst 3'] },
  prime_keys_3: { id: 'prime_keys_3', name: 'Prime Keys x3', category: 'Crate Keys', price: 1199, currency: 'eur', description: 'Ontvang 3 Prime crate keys.', commands: ['keymanager give {player} prime 3'] },
  gold_keys_10: { id: 'gold_keys_10', name: 'Gold Keys x10', category: 'Crate Keys', price: 1199, currency: 'eur', description: 'Ontvang 10 Gold crate keys.', commands: ['keymanager give {player} gold 10'] },
  prime_keys_10: { id: 'prime_keys_10', name: 'Prime Keys x10', category: 'Crate Keys', price: 2999, currency: 'eur', description: 'Ontvang 10 Prime crate keys.', commands: ['keymanager give {player} prime 10'] },

  starter_bundle: { id: 'starter_bundle', name: 'Starter Bundle', category: 'Bundels', price: 799, currency: 'eur', description: 'Coins, shards en Common crate keys voor een sterke start.', commands: ['moneymanager add {player} 25000', 'shardmanager add {player} 300', 'keymanager give {player} common 5', 'broadcast &a{player} heeft de Starter Bundle gekocht!'] },
  mega_bundle: { id: 'mega_bundle', name: 'Dynathi Mega Bundle', category: 'Bundels', price: 2499, currency: 'eur', description: 'Elite rank, veel coins, shards en Prime crate keys.', commands: ['lp user {player} parent add elite', 'moneymanager add {player} 100000', 'shardmanager add {player} 1500', 'keymanager give {player} prime 3', 'broadcast &d{player} heeft de Dynathi Mega Bundle gekocht!'] },
  live_test_bundle: { id: 'live_test_bundle', name: 'Test Mega Bundle — waarde €29,99', category: 'Bundels', price: 50, currency: 'eur', description: 'Tijdelijk testproduct voor €0,50. Levert 10.000 coins, 100 shards en 1 Common key.', commands: ['moneymanager add {player} 10000', 'shardmanager add {player} 100', 'keymanager give {player} common 1', 'broadcast &e{player} heeft de tijdelijke testbundel gekocht!'] }
};

module.exports = products;
