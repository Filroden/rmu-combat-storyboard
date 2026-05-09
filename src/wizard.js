/**
 * The core ApplicationV2 interface for the RMU Combat Narrator.
 */
import { MOCK_ROSTER, MOCK_TIMELINE } from "./mock-data.js";
import { compileDenseNotation } from "./compiler.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RMUNarratorWizard extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "rmu-narrator-wizard",
        classes: ["rmu-combat-narrator", "rmu-combat-narrator-window"],
        tag: "form",
        window: {
            title: "RMU_NARRATOR.Title",
            icon: "rmu-combat-narrator-icon wizard",
            resizable: true,
        },
        position: { width: 700, height: "auto" },
        template: "modules/rmu-combat-narrator/templates/wizard.hbs",
        actions: {
            toggleHighlight: RMUNarratorWizard.#toggleHighlight,
            changeTab: RMUNarratorWizard.#changeTab,
            copyPrompt: RMUNarratorWizard.#copyPrompt,
        },
    };

    static PARTS = {
        tabs: { template: "modules/rmu-combat-narrator/templates/parts/tabs.hbs" },
        config: { template: "modules/rmu-combat-narrator/templates/parts/config.hbs" },
        roster: { template: "modules/rmu-combat-narrator/templates/parts/roster.hbs" },
        timeline: { template: "modules/rmu-combat-narrator/templates/parts/timeline.hbs" },
        export: { template: "modules/rmu-combat-narrator/templates/parts/export.hbs" },
    };

    /**
     * Internal state management.
     */
    #state = {
        activeTab: "config",
        promptStyle: "text",
        artStyle: "gritty",
        selectedLogId: "",
        roster: foundry.utils.deepClone(MOCK_ROSTER),
        timeline: foundry.utils.deepClone(MOCK_TIMELINE),
        pageTarget: 3,
        campaignContext: "",
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Query all journals containing specific module flag
        const availableLogs = game.journal.filter((j) => j.getFlag("rmu-combat-narrator", "eventLog")).map((j) => ({ id: j.id, name: j.name }));

        const groupedTimeline = this.#groupTimelineByRound(this.#state.timeline);
        const compiledPrompt = compileDenseNotation(this.#state);

        return {
            ...context,
            state: this.#state,
            availableLogs,
            groupedTimeline,
            compiledPrompt,
        };
    }

    /**
     * Transforms the flat timeline array into a grouped object by round.
     * @param {Array} timeline
     * @returns {Object}
     */
    #groupTimelineByRound(timeline) {
        return timeline.reduce((acc, event) => {
            // Use Math.floor to group all 1.x phases into "Round 1"
            const roundNum = Math.floor(event.round);
            if (!acc[roundNum]) acc[roundNum] = [];
            acc[roundNum].push(event);
            return acc;
        }, {});
    }

    /**
     * Action handler for the highlight toggle buttons.
     */
    static async #toggleHighlight(event, target) {
        const eventId = target.dataset.eventId;
        const eventIndex = this.#state.timeline.findIndex((e) => e.id === eventId);

        if (eventIndex === -1) return;

        const isCurrentlySelected = this.#state.timeline[eventIndex].isHighlighted;

        // Guard Clause: Only block if they are trying to add a new highlight
        // and they have already hit the limit.
        if (!isCurrentlySelected && this.#hasReachedSelectionLimit()) {
            ui.notifications.warn(game.i18n.localize("RMU_NARRATOR.Wizard.Notifications.LimitReached"));

            // The DOM checkbox ticked natively before this action caught it.
            // Force the visual state back to match blocked data state.
            target.checked = false;
            return;
        }

        // State Mutation: Safe to proceed (either adding within limits, or removing)
        this.#state.timeline[eventIndex].isHighlighted = !isCurrentlySelected;
        this.render({ parts: ["timeline"] });
    }

    /**
     * Pure helper to evaluate the dynamic cap.
     * @returns {boolean}
     */
    #hasReachedSelectionLimit() {
        // Spec limits to 2 selections per requested page
        const maxAllowed = this.#state.pageTarget * 2;
        const currentSelected = this.#state.timeline.filter((e) => e.isHighlighted).length;

        return currentSelected >= maxAllowed;
    }

    /**
     * Action handler for switching tabs.
     */
    static async #changeTab(event, target) {
        const newTab = target.dataset.tab;
        if (!newTab || newTab === this.#state.activeTab) return;

        this.#state.activeTab = newTab;

        // We re-render the whole app to update tab classes and content visibility
        this.render({ force: true });
    }

    static async #copyPrompt(event, target) {
        const textarea = this.element.querySelector('[name="compiledPrompt"]');
        if (!textarea?.value) return;

        try {
            await navigator.clipboard.writeText(textarea.value);
            ui.notifications.info(game.i18n.localize("RMU_NARRATOR.Wizard.Notifications.Copied"));
        } catch (err) {
            ui.notifications.error(game.i18n.localize("RMU_NARRATOR.Wizard.Notifications.CopyFailed"));
            console.error("RMU Combat Narrator | Clipboard write failed:", err);
        }
    }

    /** @override */
    _onChangeForm(formConfig, event) {
        const target = event.target;
        const name = target.name;

        if (!name) return;

        // Load a saved log from the journal
        if (name === "selectedLogId") {
            this.#loadLogFromJournal(target.value);
            return;
        }

        // Handle roster array updates
        if (name.startsWith("roster.")) {
            const actorId = name.split(".")[1];
            const actor = this.#state.roster.find((a) => a.id === actorId);
            if (actor) actor.descriptor = target.value;
            return;
        }

        // Handle root configuration updates
        this.#state[name] = target.value;
    }

    /**
     * Replaces the active timeline and roster with the selected journal log.
     */
    #loadLogFromJournal(journalId) {
        const journal = game.journal.get(journalId);
        if (!journal) return;

        const savedLog = journal.getFlag("rmu-combat-narrator", "eventLog") || [];
        const savedRoster = journal.getFlag("rmu-combat-narrator", "roster") || [];

        this.#state.timeline = savedLog;
        this.#state.roster = savedRoster;
        this.#state.selectedLogId = journalId;

        this.render({ force: true });
    }
}
