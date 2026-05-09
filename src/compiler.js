/**
 * Core Sieve compiler for the RMU Combat Narrator.
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
    const baseDirectives = `[Director's Instructions]
Target Length: Exactly ${state.pageTarget} pages.
Layout Rules: Maximum 3 to 4 panels per page. Do not mention game mechanics, dice, phases, or turns. Present continuous, cinematic action. Maintain spatial continuity based on the Stage Layouts.

[Notation Legend]
The combat timeline uses the following shorthand:
- [!] (Hero Moment): This event MUST be the dominant, largest panel on its respective page. If multiple [!] events occur on the same page, you must either combine them into a single massive splash panel showing simultaneous action, or explicitly prioritize the one with the highest kinetic impact.
- ^ (Explosive Force): Emphasize overwhelming physical power and momentum.
- v (Catastrophic Momentum): Describe the character fighting their own momentum, slipping, or moving jarringly wrong.
- !! (Strange Fate): The action is uncanny, bizarre, or aesthetically eerie.`;

    const artStyleMap = {
        gritty: "modern gritty comic style, heavy shadows, muted palette, high contrast inking",
        manga: "Japanese manga style, detailed screentones, dynamic speed lines, monochrome black and white",
        pop: "bright pop-art comic style, vibrant saturated colors, bold halftone dots, crisp thick outlines",
    };

    const resolvedArtStyle = artStyleMap[state.artStyle] || artStyleMap["gritty"];

    // DRY: Extract shared image rules so both formats behave identically
    const sharedImageRules = `Image Generation Rules:
1. Core Style: Enforce a ${resolvedArtStyle}. Allow characters or weapons to break panel borders.
2. Environment Lock: Strictly maintain the exact weather, lighting, and background established in the [Campaign Context] across all pages.
3. Literal Translation: Do not pass game mechanics to the image generator. Translate concepts like 'Scene (Falling)' or 'Breakage' into literal, physical phenomena (e.g., crumbling cliff edges, snapping wood).
4. Focal Hierarchy (Anti-Bleed): To prevent entity hallucination, limit the prompt to a maximum of TWO highly detailed, named characters per panel (usually the attacker and primary target). For mass brawls or area attacks, render additional combatants purely as shadowy silhouettes, blurred foreground elements, or atmospheric background shapes.
5. Character Continuity: Use the Cast List for strict visual reference.`;

    const formatMap = {
        text: `[Output Format]
Write a highly visual comic book script for the GM to read.
Format each panel with: Size/Camera (e.g., Wide Shot, Extreme Close-Up), Visual Description, and optionally a short Atmospheric Caption (to set the scene/mood) or a visceral SFX. Do not include dialogue bubbles.`,

        image: `[Output Format]
For EVERY page, you must output two things:
1. The Script: The narrative description formatted for a comic reader. Format each panel with Size/Camera, Visual Description, and optional Atmospheric Captions or SFX.
2. The Image Prompt: A comma-separated prompt specifically optimized for Midjourney/Stable Diffusion, enclosed in a \`\`\` code block. Begin every prompt with "${resolvedArtStyle}, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders".

${sharedImageRules}`,

        autodraw: `[Output Format & Execution Directive]
As you write the script, you must automatically generate an image for every single page.
Format: Write the text script for Page X (formatting panels with Size/Camera, Visual Description, and optional Atmospheric Captions/SFX), then immediately trigger your internal image generator to create a single image containing the 3-4 panels for that page.

${sharedImageRules}`,
    };

    const formatPrompt = formatMap[state.promptStyle] || formatMap["text"];

    return `${baseDirectives}\n\n${formatPrompt}`;
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

    const eventLines = timeline.map(_compileEvent);
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
    const flair = event.flair ? ` ${event.flair} ` : "";

    const baseAction = `[Phase: ${event.round}] ${highlight}${event.source} ${event.actionType} ${event.target} (${event.weapon})`;

    // Only wrap in parentheses if an effect name exists
    const effectStr = event.effect ? ` (${event.effect})` : "";

    // Only append result/flair if there is actual data, avoiding trailing spaces
    const outcomeStr = event.result ? ` ${flair}${event.result}${effectStr}.` : "";
    const narrativeStr = event.systemNarrative ? ` ${event.systemNarrative}` : "";

    // Clean up any double spaces caused by concatenation
    return `${baseAction}${outcomeStr}${narrativeStr}`.replaceAll(/\s+/g, " ").trim();
}
