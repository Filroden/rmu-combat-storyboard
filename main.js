/**
 * Core entry point for RMU Combat Narrator.
 */
import { registerSidebarInjection } from "./src/sidebar-injection.js";
import { registerSystemHooks } from "./src/rmu-adapter.js";

// Initialisation hook
Hooks.once("init", () => {
    console.log("RMU Combat Narrator | Initialising Sieve and Wizard UI");

    // Register UI injections
    registerSidebarInjection();
    registerSystemHooks();

    // Future: registerSettings() will go here
});
