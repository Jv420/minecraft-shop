package nl.dynathi.store;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;

public final class DynathiStoreBridge extends JavaPlugin {
    private final Gson gson = new Gson();
    private final AtomicBoolean checking = new AtomicBoolean(false);
    private HttpClient httpClient;
    private BukkitTask pollingTask;
    private StoreGuiManager guiManager;
    private PlayerShopGui playerShopGui;
    private LicenseManager licenseManager;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        this.httpClient = buildHttpClient();
        this.licenseManager = new LicenseManager(this);
        this.guiManager = new StoreGuiManager(this);
        this.playerShopGui = new PlayerShopGui(this);
        getServer().getPluginManager().registerEvents(guiManager, this);
        getServer().getPluginManager().registerEvents(playerShopGui, this);

        licenseManager.verify(true).thenAccept(result -> {
            if (!result) {
                getLogger().warning("DynathiStoreBridge licentie ongeldig: " + licenseManager.getMessage());
            }
        });
        licenseManager.scheduleChecks();
        startPolling();
        getLogger().info("DynathiStoreBridge 1.4.0 is ingeschakeld.");
    }

    @Override
    public void onDisable() {
        if (pollingTask != null) pollingTask.cancel();
        getLogger().info("DynathiStoreBridge is uitgeschakeld.");
    }

    private HttpClient buildHttpClient() {
        long timeout = Math.max(5, getConfig().getLong("request-timeout-seconds", 15));
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeout))
                .build();
    }

    private void startPolling() {
        if (pollingTask != null) pollingTask.cancel();
        long seconds = Math.max(5, getConfig().getLong("check-interval-seconds", 10));
        pollingTask = Bukkit.getScheduler().runTaskTimerAsynchronously(
                this,
                this::pollOrders,
                20L,
                seconds * 20L
        );
    }

    public void manualPoll() {
        CompletableFuture.runAsync(this::pollOrders);
    }

    public boolean isLicensed() {
        return licenseManager == null || licenseManager.isValid();
    }

    private void pollOrders() {
        if (!isLicensed()) return;
        if (!checking.compareAndSet(false, true)) return;

        String apiUrl = trimSlash(getConfig().getString("api-url", ""));
        String secret = getConfig().getString("api-secret", "");
        if (apiUrl.isBlank() || secret.isBlank()) {
            checking.set(false);
            return;
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/plugin/orders"))
                .timeout(Duration.ofSeconds(Math.max(5, getConfig().getLong("request-timeout-seconds", 15))))
                .header("x-plugin-secret", secret)
                .GET()
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (response.statusCode() != 200) {
                        String body = response.body() == null ? "" : response.body();
                        if (body.length() > 600) body = body.substring(0, 600);
                        getLogger().warning("Orders ophalen mislukt. HTTP " + response.statusCode() + " | " + body);
                        return;
                    }
                    try {
                        JsonObject root = gson.fromJson(response.body(), JsonObject.class);
                        JsonArray orders = root.has("orders") ? root.getAsJsonArray("orders") : new JsonArray();
                        for (var element : orders) {
                            processOrder(element.getAsJsonObject());
                        }
                    } catch (Exception ex) {
                        getLogger().severe("Ongeldig API antwoord: " + ex.getMessage());
                    }
                })
                .exceptionally(ex -> {
                    getLogger().warning("Store API niet bereikbaar: " + ex.getMessage());
                    return null;
                })
                .whenComplete((unused, throwable) -> checking.set(false));
    }

    private void processOrder(JsonObject order) {
        if (!isLicensed()) return;
        String orderId = order.get("id").getAsString();
        String player = order.get("player").getAsString();
        String productName = order.get("productName").getAsString();
        JsonArray commandArray = order.getAsJsonArray("commands");
        List<String> commands = new ArrayList<>();
        commandArray.forEach(element -> commands.add(element.getAsString()));

        Bukkit.getScheduler().runTask(this, () -> {
            if (!isLicensed()) return;
            List<String> failures = new ArrayList<>();
            for (String command : commands) {
                if (getConfig().getBoolean("logging.commands", true)) {
                    getLogger().info("Order " + orderId + " voert uit: " + command);
                }
                boolean success = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command);
                if (!success) failures.add(command);
            }

            boolean delivered = failures.isEmpty();
            String message = delivered
                    ? "Alle commands succesvol uitgevoerd"
                    : "Mislukte commands: " + String.join(", ", failures);

            reportResult(orderId, player, productName, delivered, message);
        });
    }

    private void reportResult(String orderId, String player, String productName, boolean delivered, String message) {
        String apiUrl = trimSlash(getConfig().getString("api-url", ""));
        String secret = getConfig().getString("api-secret", "");

        JsonObject body = new JsonObject();
        body.addProperty("orderId", orderId);
        body.addProperty("player", player);
        body.addProperty("productName", productName);
        body.addProperty("status", delivered ? "delivered" : "failed");
        body.addProperty("message", message);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/api/plugin/complete"))
                .timeout(Duration.ofSeconds(Math.max(5, getConfig().getLong("request-timeout-seconds", 15))))
                .header("content-type", "application/json")
                .header("x-plugin-secret", secret)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)))
                .build();

        httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenAccept(response -> {
                    if (getConfig().getBoolean("logging.responses", true)) {
                        String bodyText = response.body() == null ? "" : response.body();
                        if (bodyText.length() > 600) bodyText = bodyText.substring(0, 600);
                        getLogger().info("Order " + orderId + " status gemeld. HTTP " + response.statusCode() + " | " + bodyText);
                    }
                })
                .exceptionally(ex -> {
                    getLogger().warning("Orderstatus melden mislukt: " + ex.getMessage());
                    return null;
                });
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("storegui")) {
            if (!(sender instanceof Player player)) {
                sender.sendMessage("Dit commando kan alleen in-game gebruikt worden.");
                return true;
            }
            if (!sender.hasPermission("dynathistore.gui")) {
                sender.sendMessage(ChatColor.RED + "Geen toestemming.");
                return true;
            }
            if (!isLicensed()) {
                sender.sendMessage(ChatColor.RED + "De DynathiStore-licentie is ongeldig.");
                return true;
            }
            guiManager.openMain(player);
            return true;
        }

        if (command.getName().equalsIgnoreCase("buy") || command.getName().equalsIgnoreCase("webshop")) {
            if (!(sender instanceof Player player)) {
                sender.sendMessage("Dit commando kan alleen in-game gebruikt worden.");
                return true;
            }
            if (!sender.hasPermission("dynathistore.shop")) {
                sender.sendMessage(ChatColor.RED + "Geen toestemming.");
                return true;
            }
            if (!isLicensed()) {
                sender.sendMessage(ChatColor.RED + "De webshop is tijdelijk niet beschikbaar: ongeldige licentie.");
                return true;
            }
            playerShopGui.open(player);
            return true;
        }

        if (!sender.hasPermission("dynathistore.admin")) {
            sender.sendMessage(ChatColor.RED + "Geen toestemming.");
            return true;
        }

        if (args.length == 0 || args[0].equalsIgnoreCase("status")) {
            sender.sendMessage(ChatColor.GREEN + "DynathiStoreBridge actief.");
            sender.sendMessage(ChatColor.GRAY + "API: " + getConfig().getString("api-url"));
            sender.sendMessage(ChatColor.GRAY + "Interval: " + getConfig().getLong("check-interval-seconds", 10) + " seconden");
            if (licenseManager != null) licenseManager.sendStatus(sender);
            return true;
        }

        if (args[0].equalsIgnoreCase("license")) {
            sender.sendMessage(ChatColor.YELLOW + "Licentie wordt opnieuw gecontroleerd...");
            licenseManager.verify(true).thenAccept(result -> Bukkit.getScheduler().runTask(this, () ->
                    licenseManager.sendStatus(sender)));
            return true;
        }

        if (args[0].equalsIgnoreCase("reload")) {
            reloadConfig();
            this.httpClient = buildHttpClient();
            this.licenseManager = new LicenseManager(this);
            licenseManager.verify(true);
            licenseManager.scheduleChecks();
            startPolling();
            sender.sendMessage(ChatColor.GREEN + "Configuratie herladen.");
            return true;
        }

        if (args[0].equalsIgnoreCase("check")) {
            if (!isLicensed()) {
                sender.sendMessage(ChatColor.RED + "Ordercheck geblokkeerd: ongeldige licentie.");
                return true;
            }
            manualPoll();
            sender.sendMessage(ChatColor.YELLOW + "Handmatige ordercheck gestart.");
            return true;
        }

        sender.sendMessage(ChatColor.YELLOW + "/storebridge <status|reload|check|license>");
        return true;
    }

    private String trimSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
