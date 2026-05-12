/**
 * Translates the raw RMU attack payload into our Dense Notation schema.
 */
export function translateAttackData(attackData) {
    // Intercept the Scene Attack token ID
    const attacker = attackData.attackerTokenId === "aog" ? "Environment" : canvas.tokens.get(attackData.attackerTokenId)?.name || "Unknown Attacker";

    const defender = canvas.tokens.get(attackData.defenderTokenId)?.name || "Unknown Defender";

    return {
        id: foundry.utils.randomID(),
        type: "combatAction",
        round: _calculateRoundPhase(),
        source: attacker,
        target: defender,
        actionType: _mapActionType(attackData.action?.actionType),
        weapon: attackData.action?.attackName || "Unknown Weapon",
        flair: _mapFlair(attackData.statuses),
        result: _sanitizeResult(attackData.attackResult, attackData.statuses),
        effect: _mapEffects(attackData.effects, attackData.criticals),
        systemNarrative: _buildNarrative(attackData.location, attackData.effects, attackData.statuses),
        isHighlighted: false,
    };
}

/**
 * Accurately formats the current Round and Phase (e.g. "1.1") by querying the RMU system flags.
 */
function _calculateRoundPhase() {
    const combat = game.combat;

    if (!combat?.started) return "0.0";

    const round = combat.round || 0;
    const phase = combat.getFlag("rmu", "actionPhase.currentPhase") ?? 1;

    return `${round}.${phase}`;
}

function _mapActionType(type) {
    const rangedTypes = ["Ranged", "Thrown", "Spell", "AoE"];
    return rangedTypes.includes(type) ? "=>" : "->";
}

function _mapFlair(statuses) {
    if (!Array.isArray(statuses)) return "";

    if (statuses.includes("Natural 66")) return "!!";
    if (statuses.includes("Open End Up")) return "^";
    if (statuses.includes("Open End Down")) return "v";

    return "";
}

function _sanitizeResult(rawResult, statuses) {
    let result = (rawResult || "").toString().replaceAll("undefined", "").trim();

    if (Array.isArray(statuses)) {
        // 1. Establish the base failure state if applicable
        if (statuses.includes("Fumble")) {
            result = result === "0" ? "Fumble" : `${result} (Fumble)`;
        } else if (statuses.includes("Miss")) {
            result = result === "0" ? "Miss" : `${result} (Miss)`;
        }

        // 2. Append Breakage as an explicit visual cue for the LLM
        if (statuses.includes("Breakage")) {
            result = result === "" ? "Breakage" : `${result} (Breakage)`;
        }
    }

    return result;
}

function _mapEffects(effects, criticals) {
    const critStrings = _extractCriticals(criticals);
    const effectStrings = _extractMechanicalEffects(effects);

    const combined = [...critStrings, ...effectStrings];
    return combined.length > 0 ? combined.join(", ") : "";
}

function _extractCriticals(criticals) {
    if (!Array.isArray(criticals)) return [];

    return criticals
        .map((c) => {
            if (!c.severity && !c.critical) return null;
            return `${c.severity || ""}-${c.critical || ""}`.replace(/^-|-$/, "");
        })
        .filter(Boolean);
}

function _extractMechanicalEffects(effects) {
    if (!Array.isArray(effects)) return [];

    const visualEffects = effects.filter((e) => e.effect && !["Hits", "Attack Hits"].includes(e.effect));

    return visualEffects.map((e) => {
        const val = e.value || e.rounds?.[0] || e.count || "";
        return val ? `${e.effect} ${val}` : e.effect;
    });
}

function _buildNarrative(location, effects, statuses) {
    let locString = "";
    const isMiss = Array.isArray(statuses) && statuses.includes("Miss");

    if (location && !isMiss) {
        const side = location.side ? `${location.side} ` : "";
        locString = location.location ? `Hit ${side}${location.location}. ` : "";
    }

    const validDescriptions = Array.isArray(effects) ? [...new Set(effects.map((e) => e.description).filter(Boolean))] : [];

    return `${locString}${validDescriptions.join(" ")}`.trim();
}

export function translateSpellData(spellData) {
    const attacker = spellData.attackerTokenId === "aog" ? "Environment" : canvas.tokens.get(spellData.attackerTokenId)?.name || "Unknown Caster";

    // Dynamically assign the defender based on the exact AoE property
    let defender = "Unknown Target";
    if (spellData.defenderTokenId) {
        defender = canvas.tokens.get(spellData.defenderTokenId)?.name || "Unknown Target";
    } else if (spellData.spell?.aoe) {
        const aoe = spellData.spell.aoe.toLowerCase();
        defender = aoe === "caster" || aoe === "self" ? attacker : `[AoE: ${spellData.spell.aoe}]`;
    }

    const spellName = spellData.spell?.name || "Unknown Spell";
    const spellList = spellData.spell?.spellList || "";
    const realms = Array.isArray(spellData.realms) ? spellData.realms.join("/") : "Magic";

    // Pass the raw description through as the narrative
    const rawDescription = spellData.spell?._translatedDescription || spellData.spell?.description || "";

    const spellString = spellList ? `${realms} Spell (${spellList}): ${spellName}` : `${realms} Spell: ${spellName}`;

    return {
        id: foundry.utils.randomID(),
        type: "combatAction",
        round: _calculateRoundPhase(),
        source: attacker,
        target: defender,
        actionType: "=>",
        weapon: spellString,
        flair: _mapFlair(spellData.statuses),
        result: _sanitizeSpellResult(spellData.statuses),
        effect: "",
        systemNarrative: rawDescription,
        isHighlighted: false,
    };
}

/**
 * Extracts the core casting resolution from the statuses array.
 */
function _sanitizeSpellResult(statuses) {
    if (!Array.isArray(statuses)) return "";

    let result = [];

    // Core Resolution
    if (statuses.includes("Spellcasting Success")) result.push("Success");
    if (statuses.includes("Spellcasting Failure")) result.push("Failure");

    // Spell Context
    if (statuses.includes("Resistible")) result.push("(Resistible)");
    if (statuses.includes("Utility")) result.push("(Utility)");

    return result.join(" ");
}
