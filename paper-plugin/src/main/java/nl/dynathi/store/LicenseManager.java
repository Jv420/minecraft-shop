package nl.dynathi.store;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public final class LicenseManager {
    private final DynathiStoreBridge plugin;
    private final Gson gson = new Gson();
    private final HttpClient httpClient;
    private volatile boolean valid = true;
    private volatile String message = "Licentiecontrole uitgeschakeld";
    private volatile Instant lastSuccessfulCheck = Instant.EPOCH;

    public LicenseManager(DynathiStoreBridge plugin) {
        this.plugin = plugin;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public CompletableFuture<Boolean> verify(boolean force) {
        if (!plugin.getConfig().getBoolean("license.enabled", false)) {
            valid = true;
            message = "Licentiecontrole uitgeschakeld";
            return CompletableFuture.completedFuture(true);
        }

        String serverUrl = trimSlash(plugin.getConfig().getString("license.server-url", ""));
        String key = plugin.getConfig().getString("license.key", "");
        String product = plugin.getConfig().getString("license.product", "DYNASTORE-PLUGIN");
        String instanceId = plugin.getConfig().getString("license.instance-id", "");

        if (serverUrl.isBlank() || key.isBlank() || instanceId.isBlank()) {
            valid = false;
            message = "Licentieconfiguratie ontbreekt";
            return CompletableFuture.completedFuture(false);
        }

        JsonObject body = new JsonObject();
        body.addProperty("key", key);
        body.addProperty("product", product);
        body.addProperty("instanceId", instanceId);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(serverUrl + "/api/licenses/verify"))
                .timeout(Duration.ofSeconds(20))
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(body)))
                .build();

        return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(response -> {
                    if (response.statusCode() != 200) {
                        return handleFailure("HTTP " + response.statusCode());
                    }

                    try {
                        JsonObject data = gson.fromJson(response.body(), JsonObject.class);
                        boolean result = data.has("valid") && data.get("valid").getAsBoolean();
                        valid = result;
                        message = result ? "Licentie geldig" : "Licentie ongeldig";
                        if (result) lastSuccessfulCheck = Instant.now();
                        return result;
                    } catch (Exception ex) {
                        return handleFailure("Ongeldig licentieantwoord: " + ex.getMessage());
                    }
                })
                .exceptionally(ex -> handleFailure("Licentieserver niet bereikbaar: " + ex.getMessage()));
    }

    private boolean handleFailure(String reason) {
        long failOpenMinutes = Math.max(0, plugin.getConfig().getLong("license.fail-open-minutes", 60));
        boolean withinGrace = !lastSuccessfulCheck.equals(Instant.EPOCH)
                && Instant.now().isBefore(lastSuccessfulCheck.plusSeconds(failOpenMinutes * 60));

        if (withinGrace) {
            valid = true;
            message = "Licentieserver tijdelijk onbereikbaar; grace period actief";
            return true;
        }

        valid = false;
        message = reason;
        return false;
    }

    public void scheduleChecks() {
        if (!plugin.getConfig().getBoolean("license.enabled", false)) return;
        long minutes = Math.max(5, plugin.getConfig().getLong("license.check-interval-minutes", 30));
        Bukkit.getScheduler().runTaskTimerAsynchronously(
                plugin,
                () -> verify(false).thenAccept(result -> {
                    if (!result) {
                        plugin.getLogger().warning("Licentie ongeldig: " + message);
                    }
                }),
                20L,
                minutes * 60L * 20L
        );
    }

    public boolean isValid() {
        return valid;
    }

    public String getMessage() {
        return message;
    }

    public void sendStatus(org.bukkit.command.CommandSender sender) {
        sender.sendMessage(ChatColor.GOLD + "DynathiStore licentie: "
                + (valid ? ChatColor.GREEN + "GELDIG" : ChatColor.RED + "ONGELDIG"));
        sender.sendMessage(ChatColor.GRAY + message);
    }

    private String trimSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
