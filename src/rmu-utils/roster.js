/**
 * Extracts the active combatants into a default Cast List for the Wizard UI.
 */
export function extractCombatRoster(combat) {
    const roster = combat.combatants
        .map((c) => {
            const actor = c.actor;
            if (!actor) return null;

            return {
                id: c.token?.id || c.id,
                name: c.name,
                descriptor: _buildActorDescriptor(actor),
            };
        })
        .filter(Boolean);

    // Inject the Scene as a permanent cast member so the GM can visually describe it
    roster.push({
        id: "aog",
        name: "Environment",
        descriptor: "Various environmental hazards, falling, traps, etc.", // The GM can overwrite this in the UI
    });

    return roster;
}

/**
 * Builds a sensible default visual descriptor, dynamically adapting to Characters vs Creatures.
 */
function _buildActorDescriptor(actor) {
    const sys = actor.system;

    const size = sys.appearance?.size || "";
    const race = sys._header?._raceName || "";
    const culture = sys._header?._cultureName || "";
    const profession = sys._header?._professionName || "";

    let traits = [];

    if (actor.type === "Creature") {
        traits = [size, culture, race];
    } else {
        traits = [size, race, profession];
    }

    return traits
        .filter((val) => val && val !== "None" && val !== "Unknown")
        .join(" ")
        .trim();
}
