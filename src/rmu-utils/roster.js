/**
 * Extracts the active combatants into a default Cast List for the Wizard UI.
 */
export function extractCombatRoster(combat) {
    const roster = combat.combatants
        .map((c) => {
            const actor = c.actor;
            const token = c.token;
            if (!actor) return null;

            return {
                id: token?.id || c.id,
                name: token?.name || c.name,
                descriptor: _buildActorDescriptor(actor, token),
            };
        })
        .filter(Boolean);

    // Inject the Scene as a permanent cast member so the GM can visually describe it
    roster.push({
        id: "aog",
        name: game.i18n.localize("RMU_STORYBOARD.Wizard.Roster.EnvironmentName"),
        descriptor: game.i18n.localize("RMU_STORYBOARD.Wizard.Roster.EnvironmentDescriptor"),
    });

    return roster;
}

/**
 * Builds a sensible default visual descriptor, dynamically adapting to Characters vs Creatures.
 */
function _buildActorDescriptor(actor, token) {
    const sys = actor.system;

    const size = _calculateTokenSizeDescriptor(token);
    const armor = _calculateArmorDescriptor(actor);
    const shield = _calculateShieldDescriptor(actor);
    const race = sys._header?._raceName || "";
    const culture = sys._header?._cultureName || "";
    const profession = sys._header?._professionName || "";

    let traits = [];

    if (actor.type === "Creature") {
        traits = [size, culture, race, armor, shield];
    } else {
        traits = [size, race, profession, armor, shield];
    }

    return traits
        .filter((val) => val && val !== "None" && val !== "Unknown")
        .join(", ")
        .trim();
}

/**
 * Translates grid dimensions into a semantic size phrase for the AI prompt.
 */
function _calculateTokenSizeDescriptor(token) {
    if (!token) return "medium-sized";

    // Use the area (product of width and height) to better approximate overall mass
    const area = (token.width || 1) * (token.height || 1);

    if (area < 1) return "small-sized";
    if (area === 1) return "medium-sized";
    if (area < 9) return "large-sized"; // e.g., 2x2 (area 4)
    if (area < 36) return "huge-sized"; // e.g., 4x4 Titan (area 16)
    if (area < 144) return "gargantuan-sized"; // e.g., 9x9 Dragon (area 81)
    return "colossal-sized"; // e.g., 18x18 Demon Whale (area 324)
}

/**
 * Translates RMU Armor Types (AT) into a semantic visual descriptor.
 */
function _calculateArmorDescriptor(actor) {
    if (!actor?.system) return "";

    const wornAT = actor.system._armor?.Torso?.AT || 1;
    const naturalAT = actor.system._naturalAT || 1;

    // Determine which armor is visually dominant.
    // We favor worn armor if they are equal, as clothing/armor covers the body.
    const isNatural = naturalAT > wornAT;
    const activeAT = Math.max(wornAT, naturalAT);

    // Baseline unarmored state
    if (activeAT === 1) {
        return isNatural ? "" : "wearing light clothing";
    }

    if (isNatural) {
        const naturalMap = {
            2: "covered in thick fur",
            3: "covered in heavy hide",
            4: "covered in scaled hide",
            5: "covered in overlapping segmented plates",
            6: "covered in an armored carapace",
            7: "covered in metallic scales",
            8: "covered in metallic-hard fur",
            9: "covered in overlapping metallic bands",
            10: "covered in a metallic shell",
        };
        return naturalMap[activeAT] || "";
    } else {
        const wornMap = {
            2: "wearing heavy clothing and furs",
            3: "wearing soft leather armor",
            4: "wearing hide scale armor",
            5: "wearing laminar segmented armor",
            6: "wearing rigid leather armor",
            7: "wearing metal scale armor",
            8: "wearing chain mail",
            9: "wearing brigandine armor",
            10: "wearing heavy plate armor",
        };
        return wornMap[activeAT] || "";
    }
}

/**
 * Translates an equipped RMU shield into a visual descriptor.
 */
function _calculateShieldDescriptor(actor) {
    if (!actor?.system) return "";

    const shield = actor.system._armor?.shield;

    // If the shield object is null or undefined, they aren't holding one
    if (!shield) return "";

    // Extract the size/type, defaulting to normal if somehow missing
    const type = (shield.shieldType || "normal").toLowerCase();

    // Map RMU mechanics to strong visual AI prompts
    const shieldMap = {
        target: "carrying a small buckler",
        normal: "carrying a shield",
        full: "carrying a large heavy shield",
        wall: "carrying a massive tower shield",
    };

    return shieldMap[type] || "carrying a shield";
}
