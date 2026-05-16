/**
 * Injects the module's launch button into the native Foundry Combat Tracker.
 */
import { RMUStoryboardWizard } from "./wizard.js";

export function registerSidebarInjection() {
    Hooks.on("renderCombatTracker", injectSidebarButton);
}

function injectSidebarButton(app, html) {
    if (!game.user.isGM) return;

    // Guard against jQuery wrappers to ensure native DOM manipulation
    const directoryElement = html[0] || html;

    // Target the V14 encounters navigation area
    const encountersNav = directoryElement.querySelector(".combat-tracker-header .encounters");
    if (!encountersNav) return;

    // Prevent duplicate injections during partial re-renders
    if (encountersNav.querySelector(".rmu-combat-storyboard-sidebar-btn")) return;

    const button = createWizardButton();

    // Create a safe flex wrapper to sit our button next to native elements
    const wrapper = document.createElement("div");
    wrapper.className = "rmu-storyboard-nav-wrapper";

    // Move existing native children (e.g., 'Create Encounter' or the dropdown) into our wrapper
    while (encountersNav.firstChild) {
        wrapper.appendChild(encountersNav.firstChild);
    }

    wrapper.appendChild(button);
    encountersNav.appendChild(wrapper);
}

function createWizardButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rmu-combat-storyboard-sidebar-btn";

    button.dataset.tooltip = game.i18n.localize("RMU_STORYBOARD.Title");

    const icon = document.createElement("i");
    icon.className = "rmu-combat-storyboard-icon wizard";
    button.appendChild(icon);

    button.addEventListener("click", handleWizardButtonClick);

    return button;
}

function handleWizardButtonClick(event) {
    event.preventDefault();
    const app = new RMUStoryboardWizard();
    app.render({ force: true });
}
