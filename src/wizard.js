/**
 * The core ApplicationV2 interface for the RMU Combat Storyboard.
 */
import { compileDenseNotation, buildHumanReadableTimeline, compileHumanReadableLog } from "./compiler.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RMUStoryboardWizard extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "rmu-storyboard-wizard",
        classes: ["rmu-combat-storyboard", "rmu-combat-storyboard-window"],
        tag: "form",
        window: {
            title: "RMU_STORYBOARD.Title",
            icon: "rmu-combat-storyboard-icon wizard",
            resizable: true,
        },
        position: { width: 700, height: "auto" },
        template: "modules/rmu-combat-storyboard/templates/wizard.hbs",
        actions: {
            toggleHighlight: RMUStoryboardWizard.#toggleHighlight,
            changeTab: RMUStoryboardWizard.#changeTab,
            copyPrompt: RMUStoryboardWizard.#copyPrompt,
            downloadLog: RMUStoryboardWizard.#downloadLog,
        },
    };

    static PARTS = {
        tabs: { template: "modules/rmu-combat-storyboard/templates/parts/tabs.hbs" },
        config: { template: "modules/rmu-combat-storyboard/templates/parts/config.hbs" },
        roster: { template: "modules/rmu-combat-storyboard/templates/parts/roster.hbs" },
        timeline: { template: "modules/rmu-combat-storyboard/templates/parts/timeline.hbs" },
        export: { template: "modules/rmu-combat-storyboard/templates/parts/export.hbs" },
    };

    /**
     * Internal state management.
     */
    #state = {
        activeTab: "config",
        artStyle: "gritty",
        selectedLogId: "",
        roster: [],
        timeline: [],
        pageTarget: 3,
        campaignContext: "",
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        const availableLogs = game.journal
            .filter((j) => j.getFlag("rmu-combat-storyboard", "eventLog"))
            .map((j) => ({ id: j.id, name: j.name }))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        // 2. Consume the translated timeline for the UI, leaving the LLM state untouched
        const hrTimeline = buildHumanReadableTimeline(this.#state.timeline);
        const groupedTimeline = this.#groupTimelineByRound(hrTimeline);

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
            ui.notifications.warn(game.i18n.localize("RMU_STORYBOARD.Wizard.Notifications.LimitReached"));

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
            ui.notifications.info(game.i18n.localize("RMU_STORYBOARD.Wizard.Notifications.Copied"));
        } catch (err) {
            ui.notifications.error(game.i18n.localize("RMU_STORYBOARD.Wizard.Notifications.CopyFailed"));
            console.error("RMU Combat Storyboard | Clipboard write failed:", err);
        }
    }

    /** @override */
    async _onChangeForm(formConfig, event) {
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
        } else {
            // Handle root configuration updates
            this.#state[name] = target.value;
        }

        // Auto-save edited context and roster back to the active journal
        const activeJournal = game.journal.get(this.#state.selectedLogId);
        if (activeJournal) {
            await activeJournal.setFlag("rmu-combat-storyboard", "roster", this.#state.roster);
            await activeJournal.setFlag("rmu-combat-storyboard", "campaignContext", this.#state.campaignContext);
        }
    }

    /**
     * Replaces the active timeline, roster, and context with the selected journal log.
     */
    #loadLogFromJournal(journalId) {
        const journal = game.journal.get(journalId);
        if (!journal) return;

        const savedLog = journal.getFlag("rmu-combat-storyboard", "eventLog") || [];
        const savedRoster = journal.getFlag("rmu-combat-storyboard", "roster") || [];
        const savedContext = journal.getFlag("rmu-combat-storyboard", "campaignContext") || "";

        this.#state.timeline = savedLog;
        this.#state.roster = savedRoster;
        this.#state.campaignContext = savedContext;
        this.#state.selectedLogId = journalId;

        this.render({ force: true });
    }

    /**
     * Action handler to generate and download a plain text readable combat log.
     */
    static async #downloadLog(event, target) {
        const textContent = compileHumanReadableLog(this.#state);

        // Generate a downloadable Blob natively in the browser
        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `RMU_Combat_Log_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();

        URL.revokeObjectURL(url);

        ui.notifications.info(game.i18n.localize("RMU_STORYBOARD.Wizard.Notifications.Downloaded"));
    }
}
