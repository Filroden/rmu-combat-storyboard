const DEBOUNCE_DELAY_MS = 100;

let _eventQueue = [];
let _queueTimer = null;

/**
 * Safely writes a new storyboard event to the active combat document using a debounce queue.
 */
export function persistEventToCombat(storyboardEvent) {
    _eventQueue.push(storyboardEvent);

    if (_queueTimer) clearTimeout(_queueTimer);

    _queueTimer = setTimeout(_processEventQueue, DEBOUNCE_DELAY_MS);
}

async function _processEventQueue() {
    const combat = game.combat;
    if (!combat || _eventQueue.length === 0) return;

    const pendingEvents = [..._eventQueue];
    _eventQueue = [];

    const currentLog = combat.getFlag("rmu-combat-storyboard", "eventLog") || [];
    const updatedLog = currentLog.concat(pendingEvents);

    await combat.setFlag("rmu-combat-storyboard", "eventLog", updatedLog);
}

/**
 * Creates a persistent JournalEntry inside a dedicated folder to store the event log.
 */
export async function createJournalLog(eventLog, roster) {
    const folderName = game.i18n.localize("RMU_STORYBOARD.Dialogs.FolderName");
    let folder = game.folders.find((f) => f.type === "JournalEntry" && f.name === folderName);

    if (!folder) {
        folder = await Folder.create({
            name: folderName,
            type: "JournalEntry",
            color: "#605320",
        });
    }

    await JournalEntry.create({
        name: _generateSortableName(),
        folder: folder.id,
        pages: [
            {
                name: game.i18n.localize("RMU_STORYBOARD.Dialogs.JournalPageName"),
                type: "text",
                text: { content: game.i18n.localize("RMU_STORYBOARD.Dialogs.JournalPageText") },
            },
        ],
        flags: {
            "rmu-combat-storyboard": {
                eventLog: eventLog,
                roster: roster,
            },
        },
    });

    ui.notifications.info(game.i18n.localize("RMU_STORYBOARD.Wizard.Notifications.LogSaved"));
}

/**
 * Generates a deterministically sortable timestamp.
 * Output: "Encounter: YYYY/MM/DD, HH:MM:SS"
 */
function _generateSortableName() {
    const now = new Date();

    // Helper to ensure single digits are padded with a leading zero (e.g., "05" instead of "5")
    const pad = (n) => n.toString().padStart(2, "0");

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `Encounter: ${year}/${month}/${day}, ${hours}:${minutes}:${seconds}`;
}
