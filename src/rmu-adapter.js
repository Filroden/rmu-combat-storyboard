import { translateAttackData } from "./rmu-utils/translator.js";
import { generateStageLayout } from "./rmu-utils/spatial.js";
import { extractCombatRoster } from "./rmu-utils/roster.js";
import { persistEventToCombat, createJournalLog } from "./rmu-utils/persistence.js";

/**
 * Intercepts RMU system hooks, translates proprietary data,
 * and persists the standardised events to the active combat log.
 */
export function registerSystemHooks() {
    Hooks.on("rmu.attack", _handleAttackHook);
    Hooks.on("updateCombat", _handleCombatUpdate);
    Hooks.on("deleteCombat", _handleCombatEnd);
}

/**
 * Core handler for the attack hook.
 */
function _handleAttackHook(attackData) {
    if (!game.combat?.active) return;

    const eventLog = translateAttackData(attackData);
    if (!eventLog) return;

    persistEventToCombat(eventLog);
}

/**
 * Intercepts combat updates to generate Stage Layout keyframes at the start of new rounds.
 */
function _handleCombatUpdate(combat, updates) {
    if (!combat.started || !("round" in updates)) return;
    if (updates.round === 0) return;

    const layoutEvent = generateStageLayout(combat, updates.round);
    persistEventToCombat(layoutEvent);
}

/**
 * Intercepts combat deletion to prompt the GM to save the log.
 */
async function _handleCombatEnd(combat) {
    if (!game.user.isGM) return;

    const eventLog = combat.getFlag("rmu-combat-narrator", "eventLog");
    if (!eventLog || eventLog.length === 0) return;

    const roster = extractCombatRoster(combat);

    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: {
            title: game.i18n.localize("RMU_NARRATOR.Dialogs.SaveLogTitle"),
            icon: "fas fa-book-journal-whills",
        },
        content: `<p>${game.i18n.localize("RMU_NARRATOR.Dialogs.SaveLogPrompt")}</p>`,
        rejectClose: false,
        modal: true,
    });

    if (confirmed) {
        await createJournalLog(eventLog, roster);
    }
}
