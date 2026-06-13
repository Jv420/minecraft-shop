package nl.dynathi.store;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

public final class StoreGuiManager implements Listener {
    private static final String MAIN_TITLE = ChatColor.DARK_AQUA + "Dynathi Store Beheer";
    private static final String ORDERS_TITLE = ChatColor.DARK_GREEN + "Recente Bestellingen";
    private static final String PLAYERS_TITLE = ChatColor.GOLD + "Kies een speler";
    private static final String GIVEAWAY_PLAYERS_TITLE = ChatColor.DARK_PURPLE + "Giveaway winnaar";
    private static final String GIFTS_TITLE = ChatColor.LIGHT_PURPLE + "Kies een cadeau";

    private final DynathiStoreBridge plugin;
    private final Gson gson = new Gson();
    private final HttpClient httpClient;
    private final Map<UUID, Map<Integer, JsonObject>> orderSlots = new HashMap<>();
    private final Map<UUID, Map<Integer, String>> playerSlots = new HashMap<>();
    private final Map<UUID, Map<Integer, String>> giveawayPlayerSlots = new HashMap<>();
    private final Map<UUID, String> giftTargets = new HashMap<>();
    private final Map<UUID, Map<Integer, String>> giftProductSlots = new HashMap<>();

    public StoreGuiManager(DynathiStoreBridge plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public void openMain(Player player) {
        Inventory inventory = Bukkit.createInventory(null, 27, MAIN_TITLE);
        inventory.setItem(10, item(Material.CHEST, ChatColor.GREEN + "Bestellingen bekijken",
                ChatColor.GRAY + "Bekijk recente orders en retry mislukte orders."));
        inventory.setItem(13, item(Material.BUNDLE, ChatColor.LIGHT_PURPLE + "Cadeau geven",
                ChatColor.GRAY + "Kies zelf een product voor een online speler."));
        inventory.setItem(16, item(Material.FIREWORK_ROCKET, ChatColor.GOLD + "Random giveaway",
                ChatColor.GRAY + "Kies een online winnaar en geef een willekeurig actief product."));
        inventory.setItem(22, item(Material.REDSTONE_TORCH, ChatColor.YELLOW + "Orders nu controleren",
                ChatColor.GRAY + "Start direct een handmatige ordercheck."));
        player.openInventory(inventory);
    }

    public void openOrders(Player player) {
        player.sendMessage(ChatColor.YELLOW + "Bestellingen worden opgehaald...");
        String apiUrl = trimSlash(plugin.getConfig().getString("api-url", ""));
        String secret = plugin.getConfig().getString("api-secret", "");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/plugin/admin-orders"))
                .timeout(Duration.ofSeconds(15))
                .header("x-plugin-secret", secret)
                .GET()
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> Bukkit.getScheduler().runTask(plugin, () -> {
                    if (response.statusCode() != 200) {
                        player.sendMessage(ChatColor.RED + "Orders ophalen mislukt: HTTP " + response.statusCode());
                        return;
                    }

                    try {
                        JsonObject root = gson.fromJson(response.body(), JsonObject.class);
                        JsonArray orders = root.getAsJsonArray("orders");
                        Inventory inventory = Bukkit.createInventory(null, 54, ORDERS_TITLE);
                        Map<Integer, JsonObject> slots = new HashMap<>();
                        int slot = 0;

                        for (var element : orders) {
                            if (slot >= 45) break;
                            JsonObject order = element.getAsJsonObject();
                            String status = order.get("status").getAsString();
                            Material material = switch (status) {
                                case "delivered" -> Material.LIME_CONCRETE;
                                case "failed" -> Material.RED_CONCRETE;
                                case "processing" -> Material.YELLOW_CONCRETE;
                                default -> Material.LIGHT_BLUE_CONCRETE;
                            };

                            List<String> lore = new ArrayList<>();
                            lore.add(ChatColor.GRAY + "Speler: " + ChatColor.WHITE + order.get("player").getAsString());
                            lore.add(ChatColor.GRAY + "Status: " + colorStatus(status) + status);
                            lore.add(ChatColor.GRAY + "Order: " + ChatColor.DARK_GRAY + order.get("id").getAsString());
                            if (order.has("message") && !order.get("message").isJsonNull()) {
                                lore.add(ChatColor.GRAY + "Info: " + ChatColor.WHITE + order.get("message").getAsString());
                            }
                            if (status.equals("failed") || status.equals("processing")) {
                                lore.add("");
                                lore.add(ChatColor.YELLOW + "Klik om opnieuw aan te bieden");
                            }

                            inventory.setItem(slot, item(material,
                                    ChatColor.AQUA + order.get("productName").getAsString(), lore));
                            slots.put(slot, order);
                            slot++;
                        }

                        inventory.setItem(49, item(Material.ARROW, ChatColor.YELLOW + "Terug"));
                        orderSlots.put(player.getUniqueId(), slots);
                        player.openInventory(inventory);
                    } catch (Exception ex) {
                        player.sendMessage(ChatColor.RED + "Ongeldig orderantwoord: " + ex.getMessage());
                    }
                }))
                .exceptionally(ex -> {
                    Bukkit.getScheduler().runTask(plugin, () ->
                            player.sendMessage(ChatColor.RED + "API niet bereikbaar: " + ex.getMessage()));
                    return null;
                });
    }

    public void openPlayers(Player player) {
        Inventory inventory = Bukkit.createInventory(null, 54, PLAYERS_TITLE);
        Map<Integer, String> slots = new HashMap<>();
        int slot = 0;

        for (Player target : Bukkit.getOnlinePlayers()) {
            if (slot >= 45) break;
            inventory.setItem(slot, item(Material.PLAYER_HEAD,
                    ChatColor.GOLD + target.getName(),
                    ChatColor.GRAY + "Klik om een cadeau te kiezen."));
            slots.put(slot, target.getName());
            slot++;
        }

        inventory.setItem(49, item(Material.ARROW, ChatColor.YELLOW + "Terug"));
        playerSlots.put(player.getUniqueId(), slots);
        player.openInventory(inventory);
    }

    public void openGiveawayPlayers(Player player) {
        Inventory inventory = Bukkit.createInventory(null, 54, GIVEAWAY_PLAYERS_TITLE);
        Map<Integer, String> slots = new HashMap<>();
        int slot = 0;

        for (Player target : Bukkit.getOnlinePlayers()) {
            if (slot >= 45) break;
            inventory.setItem(slot, item(Material.PLAYER_HEAD,
                    ChatColor.LIGHT_PURPLE + target.getName(),
                    ChatColor.GRAY + "Klik om deze speler als winnaar te kiezen."));
            slots.put(slot, target.getName());
            slot++;
        }

        inventory.setItem(49, item(Material.ARROW, ChatColor.YELLOW + "Terug"));
        giveawayPlayerSlots.put(player.getUniqueId(), slots);
        player.openInventory(inventory);
    }

    public void openGiftProducts(Player player, String target) {
        giftTargets.put(player.getUniqueId(), target);
        Inventory inventory = Bukkit.createInventory(null, 54, GIFTS_TITLE);
        Map<Integer, String> slots = new HashMap<>();

        addGift(inventory, slots, 10, Material.EMERALD, "coins_10k", "10.000 Coins");
        addGift(inventory, slots, 11, Material.EMERALD_BLOCK, "coins_50k", "50.000 Coins");
        addGift(inventory, slots, 13, Material.AMETHYST_SHARD, "shards_500", "500 Shards");
        addGift(inventory, slots, 14, Material.AMETHYST_BLOCK, "shards_1500", "1.500 Shards");
        addGift(inventory, slots, 28, Material.IRON_CHESTPLATE, "vip", "VIP Rank");
        addGift(inventory, slots, 29, Material.DIAMOND_CHESTPLATE, "elite", "Elite Rank");
        addGift(inventory, slots, 30, Material.NETHERITE_CHESTPLATE, "legend", "Legend Rank");
        addGift(inventory, slots, 32, Material.CHEST, "starter_bundle", "Starter Bundle");
        addGift(inventory, slots, 33, Material.ENDER_CHEST, "mega_bundle", "Mega Bundle");
        addGift(inventory, slots, 34, Material.BUNDLE, "live_test_bundle", "Ultimate Bundle");

        inventory.setItem(49, item(Material.ARROW, ChatColor.YELLOW + "Terug naar spelers"));
        giftProductSlots.put(player.getUniqueId(), slots);
        player.openInventory(inventory);
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) return;
        String title = event.getView().getTitle();
        if (!title.equals(MAIN_TITLE) && !title.equals(ORDERS_TITLE)
                && !title.equals(PLAYERS_TITLE) && !title.equals(GIVEAWAY_PLAYERS_TITLE)
                && !title.equals(GIFTS_TITLE)) return;

        event.setCancelled(true);
        int slot = event.getRawSlot();
        if (slot < 0) return;

        if (title.equals(MAIN_TITLE)) {
            if (slot == 10) openOrders(player);
            else if (slot == 13) openPlayers(player);
            else if (slot == 16) openGiveawayPlayers(player);
            else if (slot == 22) {
                plugin.manualPoll();
                player.sendMessage(ChatColor.YELLOW + "Handmatige ordercheck gestart.");
            }
            return;
        }

        if (title.equals(ORDERS_TITLE)) {
            if (slot == 49) {
                openMain(player);
                return;
            }
            JsonObject order = orderSlots.getOrDefault(player.getUniqueId(), Map.of()).get(slot);
            if (order == null) return;
            String status = order.get("status").getAsString();
            if (status.equals("failed") || status.equals("processing")) {
                retryOrder(player, order.get("id").getAsString());
            } else {
                player.sendMessage(ChatColor.GRAY + "Deze order heeft status: " + status);
            }
            return;
        }

        if (title.equals(PLAYERS_TITLE)) {
            if (slot == 49) {
                openMain(player);
                return;
            }
            String target = playerSlots.getOrDefault(player.getUniqueId(), Map.of()).get(slot);
            if (target != null) openGiftProducts(player, target);
            return;
        }

        if (title.equals(GIVEAWAY_PLAYERS_TITLE)) {
            if (slot == 49) {
                openMain(player);
                return;
            }
            String target = giveawayPlayerSlots.getOrDefault(player.getUniqueId(), Map.of()).get(slot);
            if (target != null) randomGiveaway(player, target);
            return;
        }

        if (title.equals(GIFTS_TITLE)) {
            if (slot == 49) {
                openPlayers(player);
                return;
            }
            String productId = giftProductSlots.getOrDefault(player.getUniqueId(), Map.of()).get(slot);
            String target = giftTargets.get(player.getUniqueId());
            if (productId != null && target != null) giftOrder(player, target, productId);
        }
    }

    private void retryOrder(Player actor, String orderId) {
        post(actor, "/api/plugin/retry-order", json -> {
            json.addProperty("orderId", orderId);
            json.addProperty("actor", actor.getName());
        }, "Order opnieuw aangeboden.");
    }

    private void giftOrder(Player actor, String target, String productId) {
        post(actor, "/api/plugin/gift-order", json -> {
            json.addProperty("productId", productId);
            json.addProperty("player", target);
            json.addProperty("actor", actor.getName());
        }, "Cadeau voor " + target + " is aangemaakt.");
    }

    private void randomGiveaway(Player actor, String target) {
        String apiUrl = trimSlash(plugin.getConfig().getString("api-url", ""));
        HttpRequest productsRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/products"))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        actor.closeInventory();
        actor.sendMessage(ChatColor.YELLOW + "Willekeurig giveaway-product wordt gekozen...");

        httpClient.sendAsync(productsRequest, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (response.statusCode() != 200) {
                        Bukkit.getScheduler().runTask(plugin, () ->
                                actor.sendMessage(ChatColor.RED + "Producten ophalen mislukt: HTTP " + response.statusCode()));
                        return;
                    }

                    try {
                        JsonArray products = gson.fromJson(response.body(), JsonArray.class);
                        if (products.isEmpty()) {
                            Bukkit.getScheduler().runTask(plugin, () ->
                                    actor.sendMessage(ChatColor.RED + "Er zijn geen actieve producten."));
                            return;
                        }

                        JsonObject selected = products.get(ThreadLocalRandom.current().nextInt(products.size())).getAsJsonObject();
                        String productId = selected.get("id").getAsString();
                        String productName = selected.get("name").getAsString();

                        post(actor, "/api/plugin/gift-order", json -> {
                            json.addProperty("productId", productId);
                            json.addProperty("player", target);
                            json.addProperty("actor", actor.getName() + " (random giveaway)");
                        }, "Giveaway: " + target + " wint " + productName + ".");
                    } catch (Exception ex) {
                        Bukkit.getScheduler().runTask(plugin, () ->
                                actor.sendMessage(ChatColor.RED + "Giveaway kiezen mislukt: " + ex.getMessage()));
                    }
                })
                .exceptionally(ex -> {
                    Bukkit.getScheduler().runTask(plugin, () ->
                            actor.sendMessage(ChatColor.RED + "Store API niet bereikbaar: " + ex.getMessage()));
                    return null;
                });
    }

    private void post(Player actor, String path, java.util.function.Consumer<JsonObject> bodyBuilder, String successMessage) {
        String apiUrl = trimSlash(plugin.getConfig().getString("api-url", ""));
        String secret = plugin.getConfig().getString("api-secret", "");
        JsonObject body = new JsonObject();
        bodyBuilder.accept(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + path))
                .timeout(Duration.ofSeconds(15))
                .header("content-type", "application/json")
                .header("x-plugin-secret", secret)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)))
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> Bukkit.getScheduler().runTask(plugin, () -> {
                    if (response.statusCode() == 200) {
                        actor.sendMessage(ChatColor.GREEN + successMessage);
                        plugin.manualPoll();
                    } else {
                        actor.sendMessage(ChatColor.RED + "Actie mislukt: HTTP " + response.statusCode() + " " + response.body());
                    }
                }))
                .exceptionally(ex -> {
                    Bukkit.getScheduler().runTask(plugin, () ->
                            actor.sendMessage(ChatColor.RED + "API-fout: " + ex.getMessage()));
                    return null;
                });
    }

    private void addGift(Inventory inventory, Map<Integer, String> slots, int slot,
                         Material material, String productId, String name) {
        inventory.setItem(slot, item(material, ChatColor.LIGHT_PURPLE + name,
                ChatColor.GRAY + "Klik om dit cadeau te geven."));
        slots.put(slot, productId);
    }

    private ItemStack item(Material material, String name, String... lore) {
        return item(material, name, List.of(lore));
    }

    private ItemStack item(Material material, String name, List<String> lore) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        meta.setDisplayName(name);
        meta.setLore(lore);
        item.setItemMeta(meta);
        return item;
    }

    private ChatColor colorStatus(String status) {
        return switch (status) {
            case "delivered" -> ChatColor.GREEN;
            case "failed" -> ChatColor.RED;
            case "processing" -> ChatColor.YELLOW;
            default -> ChatColor.AQUA;
        };
    }

    private String trimSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
