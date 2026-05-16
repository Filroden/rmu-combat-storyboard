import { translateAttackData, translateSpellData, translateResistanceRollData, translateApplyDamageData } from "./rmu-utils/translator.js";
import { generateStageLayout } from "./rmu-utils/spatial.js";
import { extractCombatRoster } from "./rmu-utils/roster.js";
import { persistEventToCombat, createJournalLog } from "./rmu-utils/persistence.js";

// Map the hook types directly to their respective translation functions
const TRANSLATORS = {
    attack: translateAttackData,
    spellCast: translateSpellData,
    resistanceRoll: translateResistanceRollData,
    applyDamage: translateApplyDamageData,
};

/**
 * Intercepts RMU system hooks, translates proprietary data,
 * and persists the standardised events to the active combat log.
 */
export function registerSystemHooks() {
    Hooks.on("updateCombat", _handleCombatUpdate);
    Hooks.on("preDeleteCombat", _handleCombatEnd);

    Hooks.on("rmu.attack", (data) => _handleRMUHook("attack", data));
    Hooks.on("rmu.scr", (data) => _handleRMUHook("spellCast", data));
    Hooks.on("rmu.rr", (data) => _handleRMUHook("resistanceRoll", data));
    Hooks.on("rmu.applyDamage", (data) => _handleRMUHook("applyDamage", data));
}

/**
 * Unified handler for all RMU combat hooks.
 */
function _handleRMUHook(hookType, hookData) {
    if (!game.user.isGM) return;
    if (!game.combat?.active) return;

    // Lookup the correct translator from the dictionary
    const translator = TRANSLATORS[hookType];
    if (!translator) return;

    const eventLog = translator(hookData);
    if (!eventLog) return;

    persistEventToCombat(eventLog);
}

/**
 * Intercepts combat updates to generate Stage Layout keyframes at the start of new rounds.
 */
function _handleCombatUpdate(combat, updates) {
    if (!game.user.isGM) return;
    if (!combat.started || !("round" in updates)) return;
    if (updates.round === 0) return;

    const layoutEvent = generateStageLayout(combat, updates.round);
    persistEventToCombat(layoutEvent);
}

/**
 * Intercepts combat deletion to prompt the GM to save the log.
 */
async function _handleCombatEnd(combat, options, userId) {
    // Native First: Only show the dialog to the specific GM who actually clicked "End Combat"
    if (game.user.id !== userId || !game.user.isGM) return;

    const eventLog = combat.getFlag("rmu-combat-storyboard", "eventLog");

    // Diagnostic Probe: Check the console (F12) to see exactly what data we have
    console.log("RMU Combat storyboard | Ending Combat. Log Data:", eventLog);

    // Guard against empty combats
    if (!eventLog || eventLog.length === 0) {
        console.log("RMU Combat storyboard | Combat ended, but no events were logged. Bypassing save dialog.");
        return;
    }

    const roster = extractCombatRoster(combat);

    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: {
            title: game.i18n.localize("RMU_STORYBOARD.Dialogs.SaveLogTitle"),
            icon: "fas fa-book-journal-whills",
        },
        content: `<p>${game.i18n.localize("RMU_STORYBOARD.Dialogs.SaveLogPrompt")}</p>`,
        rejectClose: false,
        modal: true,
    });

    if (confirmed) {
        await createJournalLog(eventLog, roster);
    }
}
