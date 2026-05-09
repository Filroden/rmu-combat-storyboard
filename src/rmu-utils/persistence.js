const DEBOUNCE_DELAY_MS = 100;

let _eventQueue = [];
let _queueTimer = null;

/**
 * Safely writes a new narrator event to the active combat document using a debounce queue.
 */
export function persistEventToCombat(narratorEvent) {
    _eventQueue.push(narratorEvent);

    if (_queueTimer) clearTimeout(_queueTimer);

    _queueTimer = setTimeout(_processEventQueue, DEBOUNCE_DELAY_MS);
}

async function _processEventQueue() {
    const combat = game.combat;
    if (!combat || _eventQueue.length === 0) return;

    const pendingEvents = [..._eventQueue];
    _eventQueue = [];

    const currentLog = combat.getFlag("rmu-combat-narrator", "eventLog") || [];
    const updatedLog = currentLog.concat(pendingEvents);

    await combat.setFlag("rmu-combat-narrator", "eventLog", updatedLog);
}

/**
 * Creates a persistent JournalEntry inside a dedicated folder to store the event log.
 */
export async function createJournalLog(eventLog, roster) {
    const folderName = game.i18n.localize("RMU_NARRATOR.Dialogs.FolderName");
    let folder = game.folders.find((f) => f.type === "JournalEntry" && f.name === folderName);

    if (!folder) {
        folder = await Folder.create({
            name: folderName,
            type: "JournalEntry",
            color: "#2b2b2b",
        });
    }

    const dateStr = new Date().toLocaleString("en-GB");
    const journalName = `Encounter: ${dateStr}`;

    await JournalEntry.create({
        name: journalName,
        folder: folder.id,
        pages: [
            {
                name: game.i18n.localize("RMU_NARRATOR.Dialogs.JournalPageName"),
                type: "text",
                text: { content: game.i18n.localize("RMU_NARRATOR.Dialogs.JournalPageText") },
            },
        ],
        flags: {
            "rmu-combat-narrator": {
                eventLog: eventLog,
                roster: roster,
            },
        },
    });

    ui.notifications.info(game.i18n.localize("RMU_NARRATOR.Wizard.Notifications.LogSaved"));
}
