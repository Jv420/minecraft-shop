package nl.dynathi.store;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
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

public final class PlayerShopGui implements Listener {
    private static final String TITLE = ChatColor.DARK_AQUA + "DynathiSMP Webshop";

    private final DynathiStoreBridge plugin;
    private final HttpClient httpClient;
    private final Gson gson = new Gson();
    private final Map<UUID, Map<Integer, String>> productSlots = new HashMap<>();

    public PlayerShopGui(DynathiStoreBridge plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public void open(Player player) {
        player.sendMessage(ChatColor.YELLOW + "Webshopproducten worden geladen...");
        String apiUrl = trimSlash(plugin.getConfig().getString("api-url", ""));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/products"))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> Bukkit.getScheduler().runTask(plugin, () -> {
                    if (response.statusCode() != 200) {
                        player.sendMessage(ChatColor.RED + "Producten laden mislukt: HTTP " + response.statusCode());
                        return;
                    }

                    try {
                        JsonArray products = gson.fromJson(response.body(), JsonArray.class);
                        Inventory inventory = Bukkit.createInventory(null, 54, TITLE);
                        Map<Integer, String> slots = new HashMap<>();
                        int slot = 0;

                        for (var element : products) {
                            if (slot >= 45) break;
                            JsonObject product = element.getAsJsonObject();
                            String id = product.get("id").getAsString();
                            String name = product.get("name").getAsString();
                            String category = product.get("category").getAsString();
                            String description = product.get("description").getAsString();
                            int price = product.get("price").getAsInt();

                            List<String> lore = new ArrayList<>();
                            lore.add(ChatColor.GRAY + description);
                            lore.add("");
                            lore.add(ChatColor.GOLD + "Prijs: " + ChatColor.WHITE + euro(price));
                            lore.add(ChatColor.AQUA + "Klik om Stripe Checkout te openen");

                            inventory.setItem(slot, item(materialFor(category), ChatColor.GREEN + name, lore));
                            slots.put(slot, id);
                            slot++;
                        }

                        inventory.setItem(49, item(Material.BARRIER, ChatColor.RED + "Sluiten", List.of()));
                        productSlots.put(player.getUniqueId(), slots);
                        player.openInventory(inventory);
                    } catch (Exception ex) {
                        player.sendMessage(ChatColor.RED + "Ongeldig productantwoord: " + ex.getMessage());
                    }
                }))
                .exceptionally(ex -> {
                    Bukkit.getScheduler().runTask(plugin, () ->
                            player.sendMessage(ChatColor.RED + "Store API niet bereikbaar: " + ex.getMessage()));
                    return null;
                });
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) return;
        if (!event.getView().getTitle().equals(TITLE)) return;

        event.setCancelled(true);
        int slot = event.getRawSlot();
        if (slot == 49) {
            player.closeInventory();
            return;
        }

        String productId = productSlots.getOrDefault(player.getUniqueId(), Map.of()).get(slot);
        if (productId == null) return;

        player.closeInventory();
        createCheckout(player, productId);
    }

    private void createCheckout(Player player, String productId) {
        String apiUrl = trimSlash(plugin.getConfig().getString("api-url", ""));
        JsonObject body = new JsonObject();
        body.addProperty("productId", productId);
        body.addProperty("player", player.getName());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/create-checkout-session"))
                .timeout(Duration.ofSeconds(20))
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)))
                .build();

        player.sendMessage(ChatColor.YELLOW + "Stripe-betaallink wordt aangemaakt...");

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> Bukkit.getScheduler().runTask(plugin, () -> {
                    if (response.statusCode() != 200) {
                        player.sendMessage(ChatColor.RED + "Checkout starten mislukt: HTTP " + response.statusCode());
                        return;
                    }

                    try {
                        JsonObject result = gson.fromJson(response.body(), JsonObject.class);
                        String url = result.get("url").getAsString();

                        Component link = Component.text("[KLIK HIER OM VEILIG TE BETALEN]")
                                .color(NamedTextColor.GREEN)
                                .clickEvent(ClickEvent.openUrl(url));
                        player.sendMessage(Component.text("Je Stripe Checkout staat klaar: ").color(NamedTextColor.YELLOW).append(link));
                        player.sendMessage(ChatColor.GRAY + "Na betaling wordt je aankoop automatisch geleverd.");
                    } catch (Exception ex) {
                        player.sendMessage(ChatColor.RED + "Ongeldig checkoutantwoord: " + ex.getMessage());
                    }
                }))
                .exceptionally(ex -> {
                    Bukkit.getScheduler().runTask(plugin, () ->
                            player.sendMessage(ChatColor.RED + "Checkout API niet bereikbaar: " + ex.getMessage()));
                    return null;
                });
    }

    private Material materialFor(String category) {
        return switch (category) {
            case "Ranks" -> Material.NETHER_STAR;
            case "Coins" -> Material.EMERALD;
            case "Shards" -> Material.AMETHYST_SHARD;
            case "Crate Keys" -> Material.TRIPWIRE_HOOK;
            case "Bundels" -> Material.CHEST;
            default -> Material.PAPER;
        };
    }

    private String euro(int cents) {
        return String.format("€%.2f", cents / 100.0);
    }

    private ItemStack item(Material material, String name, List<String> lore) {
        ItemStack stack = new ItemStack(material);
        ItemMeta meta = stack.getItemMeta();
        meta.setDisplayName(name);
        meta.setLore(lore);
        stack.setItemMeta(meta);
        return stack;
    }

    private String trimSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
