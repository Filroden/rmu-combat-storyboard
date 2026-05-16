/**
 * Core Sieve compiler for the RMU Combat storyboard.
 * Transforms application state into the final Dense Notation prompt.
 */

export function compileDenseNotation(state) {
    const instructionsStr = _compileInstructions(state);
    const contextStr = _compileContext(state.campaignContext);
    const castStr = _compileCast(state.roster);
    const timelineStr = _compileTimeline(state.timeline);

    return [instructionsStr, contextStr, castStr, timelineStr].filter(Boolean).join("\n\n");
}

function _compileInstructions(state) {
    // Retrieve the GM's active Foundry language code
    const targetLang = game.settings.get("core", "language") || "en";

    const baseDirectives = `[Director's Instructions]
Target Length: Exactly ${state.pageTarget} pages.
Output Language: You MUST write the final comic script (descriptions, captions, SFX) in the language corresponding to ISO code '${targetLang}'.
Layout Rules: Maximum 3 to 4 scene transitions per page. Present continuous, cinematic action. Maintain spatial continuity based on the Stage Layouts.
Script Scrubbing: You must completely DELETE the raw notation symbols (e.g., ^, v, !!, [!]) from your final text. Do not print them. Translate their meaning into natural words, but erase the symbols themselves.
No Meta-Commentary: NEVER break the fourth wall. Do not explain your stylistic choices, summarize your constraints, or mention these instructions. Do not include conversational filler, introductions, or concluding remarks. Output strictly the cinematic narrative and absolutely nothing else.

[Notation Legend]
The combat timeline uses the following shorthand:
- [!] (Hero Moment): This event MUST be the dominant, largest moment on its respective page. If multiple [!] events occur on the same page, you must either combine them into a single massive splash scene showing simultaneous action, or explicitly prioritize the one with the highest kinetic impact.
- ^ (Explosive Force): Emphasize overwhelming physical power and momentum.
- v (Catastrophic Momentum): Describe the character fighting their own momentum, slipping, or moving jarringly wrong.
- !! (Strange Fate): The action is uncanny, bizarre, or aesthetically eerie.`;

    const artStyleMap = {
        gritty: "dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere",
        realistic: "hyper-realistic modern comic style, detailed digital painting, cinematic lighting, highly rendered textures, sharp focus, graphic novel aesthetic",
        cartoon: "traditional bright cartoon style, clean smooth line art, vibrant saturated colors, classic western animation cel style, clear and legible",
        manga: "Japanese manga style, high-contrast monochrome, detailed screentones, dynamic speed lines, sharp black and white inking",
        pop: "Roy Lichtenstein pop-art style, prominent Ben-Day dots, thick black outlines, limited primary color palette, vintage 1960s comic aesthetic",
        retro: "1980s retro comic book style, neon color accents, slightly faded vintage newsprint colors, classic bronze-age comic inking, nostalgic atmosphere",
    };

    const resolvedArtStyle = artStyleMap[state.artStyle] || artStyleMap["gritty"];

    // Extract shared image rules so both formats behave identically
    const sharedImageRules = `Image Generation Rules:
1. Core Style: Enforce a ${resolvedArtStyle}. Allow characters or weapons to break panel borders.
2. Environment Lock: Strictly maintain the exact weather, lighting, and background established in the [Campaign Context] across all pages.
3. Literal Translation: Do not pass game mechanics to the image generator. Translate concepts like 'Scene (Falling)' or 'Breakage' into literal, physical phenomena (e.g., crumbling cliff edges, snapping wood).
4. Focal Hierarchy (Anti-Bleed): To prevent entity hallucination, limit the prompt to a maximum of TWO highly detailed characters per panel (usually the attacker and primary target). For mass brawls or area attacks, render additional combatants purely as shadowy silhouettes, blurred foreground elements, or atmospheric background shapes.
5. Character Continuity: Use the Cast List for strict visual reference.
6. No Text Rule (Prompt Sanitization): Image generators will hallucinate proper nouns as floating text. You MUST completely strip all character names (e.g., "Felt", "Risato") from the Image Prompt section. Replace character names with their physical descriptors from the Cast List (e.g., "a small halfling fighter"). The final prompt must describe purely visual elements.`;

    // Hardwire the dual Script + Image format
    const outputFormat = `[Output Format]
For EVERY page, you must output exactly two sections:

**Script: Page X**
(Write the narrative script here for the GM. Format cameras and descriptions, but DO NOT use the word 'Panel' or write panel numbers. Include optional SFX here.)

**Image Prompt: Page X**
\`\`\`
Generate an image for this comic page: 
${resolvedArtStyle}, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders, [comma separated list of visual subjects, actions, and environment details for the entire page].
CRITICAL RULES: Do NOT draw any text, speech bubbles, sound effects, or panel numbers. Use strictly visual storytelling.
\`\`\`

${sharedImageRules}`;

    return `${baseDirectives}\n\n${outputFormat}`;
}

function _compileContext(context) {
    if (!context) return "";
    return `[Campaign Context]\n${context}`;
}

function _compileCast(roster) {
    if (!roster || roster.length === 0) return "";

    const castLines = roster.map((actor) => `[Cast: ${actor.id}] ${actor.name} - ${actor.descriptor}`);
    return `[Cast List]\n${castLines.join("\n")}`;
}

function _compileTimeline(timeline) {
    if (!timeline || timeline.length === 0) return "";

    const consolidatedTimeline = consolidateEvents(timeline);
    const eventLines = consolidatedTimeline.map(_compileEvent);

    return `[Combat Timeline]\n${eventLines.join("\n")}`;
}

function _compileEvent(event) {
    if (event.type === "stageLayout") return _compileStageLayout(event);
    return _compileCombatAction(event);
}

function _compileStageLayout(event) {
    const zoneStrings = event.zones.map((zone) => `[Zone: ${zone.name}] ${zone.actors.join(", ")}`);
    return `[Round: ${event.round}, Stage Layout] ${zoneStrings.join(" ")}`;
}

function _compileCombatAction(event) {
    const highlight = event.isHighlighted ? "[!] " : "";
    const baseAction = `[Phase: ${event.round}] ${highlight}${event.source} ${event.actionType} ${event.target} (${event.weapon})`;

    // Handle AoE/Multi-Attack grouping
    if (event.isAoE && event.aoeTargets) {
        const impactStrings = event.aoeTargets.map((t) => {
            const tFlair = t.flair ? `${t.flair} ` : "";
            const tEffect = t.effect ? ` (${t.effect})` : "";
            const tNarrative = t.systemNarrative ? ` ${t.systemNarrative}` : "";
            const tResult = t.result ? `${tFlair}${t.result}${tEffect}` : "";

            return `${t.target}: ${tResult}${tNarrative}`.trim();
        });

        return `${baseAction} [Impacts: ${impactStrings.join(" | ")}]`.replaceAll(/\s+/g, " ").trim();
    }

    // Standard single-target logic
    const flair = event.flair ? ` ${event.flair} ` : "";
    const effectStr = event.effect ? ` (${event.effect})` : "";
    let outcomeStr = event.result ? ` ${flair}${event.result}${effectStr}` : "";

    // Append consolidated resistances in a clean bracketed format
    if (event.resistances && event.resistances.length > 0) {
        const rrStrings = event.resistances.map((rr) => {
            const rrFlair = rr.flair ? `${rr.flair} ` : "";
            const rrEffect = rr.effect ? ` (${rr.effect})` : "";
            const rrNarrative = rr.systemNarrative ? ` ${rr.systemNarrative}` : "";

            return `${rr.source}: ${rrFlair}${rr.result}${rrEffect}${rrNarrative}`.trim();
        });
        outcomeStr += ` [Saves: ${rrStrings.join(" | ")}]`;
    }

    const fullOutcome = outcomeStr ? `${outcomeStr}.` : "";
    const narrativeStr = event.systemNarrative ? ` ${event.systemNarrative}` : "";

    return `${baseAction}${fullOutcome}${narrativeStr}`.replaceAll(/\s+/g, " ").trim();
}

/**
 * Folds individual Resistance Rolls and Applied Damage into their parent Actions.
 */
export function consolidateEvents(timeline) {
    const clonedTimeline = foundry.utils.deepClone(timeline);
    const consolidated = [];
    const eventMap = new Map();

    // Pass 1: Relational merging (Spells, RR, Damage) via linkedChatId
    for (const event of clonedTimeline) {
        _processTimelineEvent(event, eventMap, consolidated);
    }

    // Pass 2: Heuristic merging (Area of Effect / Multi-Attacks)
    return _mergeAreaAttacks(consolidated);
}

/**
 * Pass 2: Groups simultaneous identical attacks (e.g., AoE or Flurries) into a single timeline event.
 */
function _mergeAreaAttacks(timeline) {
    const merged = [];
    const aoeMap = new Map();

    for (const event of timeline) {
        // Guard: Only group standard combat actions. Skip Spells and Saves as they have their own grouping logic.
        if (event.type !== "combatAction") {
            merged.push(event);
            continue;
        }
        if (event.weapon?.includes("Spell") || event.weapon?.includes("Resistance")) {
            merged.push(event);
            continue;
        }

        // Create a unique fingerprint for this specific attack action
        const key = `${event.round}-${event.source}-${event.weapon}`;

        if (aoeMap.has(key)) {
            // If match found fold this event into the parent attack
            const parent = aoeMap.get(key);

            // If any single target hit was heroic, flag the whole AoE as heroic
            if (event.isHighlighted) parent.isHighlighted = true;

            parent.aoeTargets.push({
                target: event.target,
                flair: event.flair,
                result: event.result,
                effect: event.effect,
                systemNarrative: event.systemNarrative,
            });
        } else {
            // Initialise the array to hold individual target results
            event.aoeTargets = [
                {
                    target: event.target,
                    flair: event.flair,
                    result: event.result,
                    effect: event.effect,
                    systemNarrative: event.systemNarrative,
                },
            ];
            aoeMap.set(key, event);
            merged.push(event);
        }
    }

    // Final cleanup: flag the merged events and update the target string
    for (const event of merged) {
        if (event.aoeTargets && event.aoeTargets.length > 1) {
            event.target = `[AoE: ${event.aoeTargets.length} targets]`;
            event.isAoE = true;
        }
    }

    return merged;
}

/**
 * Helper: Routes a single event to the appropriate mapping or merging logic.
 */
function _processTimelineEvent(event, eventMap, consolidated) {
    // 1. Guard against non-relational events
    if (event.type !== "combatAction" || !event.linkedChatId) {
        if (!event.isDamageEvent) consolidated.push(event);
        return;
    }

    // 2. Map Parent Events
    if (!_isChildEvent(event)) {
        eventMap.set(event.linkedChatId, event);
        consolidated.push(event);
        return;
    }

    // 3. Route Child Events
    _routeChildEvent(event, eventMap.get(event.linkedChatId), consolidated);
}

/**
 * Helper: Directs child events to their specific merge functions or handles orphans.
 */
function _routeChildEvent(event, parent, consolidated) {
    if (event.weapon?.includes("Resistance")) {
        if (parent) _mergeResistanceRoll(parent, event);
        else consolidated.push(event); // Retain orphaned saves for visibility
        return;
    }

    if (event.isDamageEvent && parent) {
        _mergeAppliedDamage(parent, event);
    }
}

/**
 * Helper: Identifies if an event is a dependent child action.
 */
function _isChildEvent(event) {
    return event.isDamageEvent || event.weapon?.includes("Resistance");
}

/**
 * Helper: Mutates the parent event to include the resistance roll data.
 */
function _mergeResistanceRoll(parent, rrEvent) {
    parent.resistances = parent.resistances || [];
    parent.resistances.push(rrEvent);
}

/**
 * Helper: Mutates the parent event to securely overwrite potential damage with applied damage.
 */
function _mergeAppliedDamage(parent, damageEvent) {
    parent.effect = [parent.effect, damageEvent.effect].filter(Boolean).join(", ");
    parent.systemNarrative = [parent.systemNarrative, damageEvent.systemNarrative].filter(Boolean).join(" ");

    if (damageEvent.flair) {
        parent.flair = parent.flair ? `${parent.flair} ${damageEvent.flair}` : damageEvent.flair;
    }
}

/**
 * Transforms the consolidated timeline into human-readable prose for the UI and Text Export.
 */
export function buildHumanReadableTimeline(timeline) {
    const consolidated = consolidateEvents(timeline);

    return consolidated.map((event) => {
        if (event.type === "stageLayout") return event;

        // Translate structural symbols to localised prose verbs
        if (event.actionType === "->") event.actionType = game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Attacks");
        if (event.actionType === "=>") event.actionType = game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Targets");

        // Translate flairs to prose adjectives
        event.flair = _translateFlair(event.flair);

        if (event.aoeTargets) {
            event.aoeTargets.forEach((t) => (t.flair = _translateFlair(t.flair)));
        }
        if (event.resistances) {
            event.resistances.forEach((r) => (r.flair = _translateFlair(r.flair)));
        }

        return event;
    });
}

/**
 * Safely translates flair symbols by treating them as discrete tokens to prevent substring collisions.
 */
function _translateFlair(flairStr) {
    if (!flairStr) return "";

    return flairStr
        .split(" ")
        .map((token) => {
            if (token === "^") return game.i18n.localize("RMU_STORYBOARD.Wizard.Flairs.OpenEndedUp");
            if (token === "v") return game.i18n.localize("RMU_STORYBOARD.Wizard.Flairs.OpenEndedDown");
            if (token === "!!") return game.i18n.localize("RMU_STORYBOARD.Wizard.Flairs.Nat66");
            return token;
        })
        .join(" ")
        .trim();
}

/**
 * Compiles a human-readable plain text log for standard GM reference.
 */
export function compileHumanReadableLog(state) {
    const hrTimeline = buildHumanReadableTimeline(state.timeline);
    const rounds = _groupEventsByRound(hrTimeline);
    const lines = [`--- ${game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Header")} ---\n`];

    for (const [round, events] of Object.entries(rounds)) {
        lines.push(`== ${game.i18n.format("RMU_STORYBOARD.Wizard.Log.Round", { round })} ==`);

        for (const event of events) {
            lines.push(..._compileHumanReadableEvent(event));
        }

        lines.push(""); // Empty line between rounds
    }

    return lines.join("\n").trim();
}

/**
 * Helper: Groups a flat timeline array into an object keyed by round integer.
 */
function _groupEventsByRound(timeline) {
    return timeline.reduce((acc, event) => {
        const roundNum = Math.floor(event.round);
        if (!acc[roundNum]) acc[roundNum] = [];
        acc[roundNum].push(event);
        return acc;
    }, {});
}

/**
 * Helper: Routes the event to the correct formatting logic based on its type.
 */
function _compileHumanReadableEvent(event) {
    if (event.type === "stageLayout") {
        return _compileHumanReadableStageLayout(event);
    }
    return _compileHumanReadableCombatAction(event);
}

/**
 * Helper: Formats spatial layout updates.
 */
function _compileHumanReadableStageLayout(event) {
    const lines = [`[${game.i18n.localize("RMU_STORYBOARD.Wizard.Log.PositionsUpdated")}]`];
    event.zones.forEach((z) => lines.push(` - ${z.name}: ${z.actors.join(", ")}`));
    return lines;
}

/**
 * Helper: Formats standard combat actions, resolving AoE impacts and resistance saves.
 */
function _compileHumanReadableCombatAction(event) {
    const lines = [];
    const hero = event.isHighlighted ? `★ ${game.i18n.localize("RMU_STORYBOARD.Wizard.Log.HeroMoment")}: ` : "";
    const using = game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Using");

    // Only show parent results if it's NOT an AoE
    let resultStr = "";
    if (!event.isAoE && event.result) {
        resultStr = ` - ${_buildOutcomeString(event.flair, event.result, event.effect, "")}`;
    }

    // Dynamically prefix the generic spell narrative if the event provoked saves
    let narrativeStr = event.systemNarrative ? ` ${event.systemNarrative}` : "";
    if (event.resistances?.length > 0 && event.systemNarrative) {
        const failPrefix = game.i18n.localize("RMU_STORYBOARD.Wizard.Log.OnResistanceFail");
        narrativeStr = ` [${failPrefix}: ${event.systemNarrative}]`;
    }

    // Main action line
    lines.push(`${hero}${event.source} ${event.actionType} ${event.target} ${using} [${event.weapon}]${resultStr}${narrativeStr}`);

    // Child impacts
    if (event.isAoE && event.aoeTargets) {
        event.aoeTargets.forEach((t) => {
            const outcome = _buildOutcomeString(t.flair, t.result, t.effect, t.systemNarrative);
            lines.push(`   > ${game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Impact")} (${t.target}): ${outcome}`);
        });
    }

    // Child saves
    if (event.resistances?.length > 0) {
        event.resistances.forEach((r) => {
            const outcome = _buildOutcomeString(r.flair, r.result, r.effect, r.systemNarrative);
            lines.push(`   > ${game.i18n.localize("RMU_STORYBOARD.Wizard.Log.Save")} (${r.source}): ${outcome}`);
        });
    }

    return lines;
}

/**
 * Helper: Utility to securely concatenate flair, results, effects, and narrative fragments.
 */
function _buildOutcomeString(flair, result, effect, narrative) {
    const formattedFlair = flair ? `${flair} ` : "";
    const formattedEffect = effect ? ` (${effect})` : "";
    const formattedNarrative = narrative ? ` ${narrative}` : "";

    return `${formattedFlair}${result || ""}${formattedEffect}${formattedNarrative}`.trim();
}
