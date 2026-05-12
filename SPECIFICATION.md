# RMU Combat Narrator: Master Specification

## 1. Project Intent

An event-driven combat logger for **Foundry VTT (v13+)** specifically for **Rolemaster Unified (RMU)**.

It captures:

- contextual information
  - participating tokens (name, race, profession, equipped items)

- specific combat events which are logged to the specific combat round and phase they occurred and capturing sufficient context (e.g. attacker and defender(s), equipment/spell used, etc)
  - attacks made (melee, ranged, unarmed, shield, directed spells)
  - flair rolls (any opened ended up/down rolls, and natural 66 rolls specifically for attacks)
  - attack results (concussion damage and criticals applied, body part hit, etc)
  - fumbles and fumble results
  - equipment breakages and outcomes
  - spells cast, resistance roll results and spell results
  - spell casting failures and failure results
  - concentration and fatigue rolls and outcomes
  - skill manoeuvre rolls and degree of success/failure (absolute, partial, etc)

- relative positioning of tokens at the start of each round (or phase)

It transforms raw mechanical "firehose" data into a dense Markdown timeline, which is then used to create a prompt for an LLM to create a "Director's Script" (page length, cinematographic directions, etc). This script can then be used to generate the comic book illustrations.

## 2. Core Data Model

### 2.1 The "Sieve" Architecture

The module will utilise hooks being added by the system developer (unknown at this stage) to ingest the system's detailed data model. A dedicated extractor will filter this into a **Dense Notation** string to ensure token efficiency for LLM context windows.

### 2.2 Indicative Notation Legend

This notation will need to be updated to reflect available information from the system hooks.

- **`[Phase]`**
- **`->` / `=>`**: Physical Attack vs. Magical/Skill Action.
- **`[Zone: Name]`: Semantic positioning of the token relative to the encounter (e.g., Melee Centre, Periphery, Distant Cover).
- **`!!` (Natural 66)**: A "Strange Fate" event. The outcome happens in an unusual, memorable, or bizarre fashion.
- **`^` (Open-Ended-Up)**: Explosive power, overwhelming force, or incredible follow-through, even if the result is a failure.
- **`v` (Open-Ended-Down)**: Catastrophic momentum in the wrong direction; things going very badly wrong even if the result is a success.
- **`!` (Feature)**: A "Hero Moment" flagged by the GM for a splash-page or dominant panel.
- **`X` (Lethal/Finishing Blow)**: Explicitly flagging the exact event that drops a token to 0 HP or causes death.
- **`[State: Condition]`**: Tracking highly visual status effects that alter a character's posture or appearance (e.g., Prone, Stunned, Bleeding).

### 2.3 Data Persistence

Data will be persisted during active combat by writing event data to the `Combat` document's flags. At the end of combat we hook into `deleteCombat` and create a new `JournalEntry` which acts as a permenant server-side database.

### 3. Spatial Continuity: Semantic Zoning & Keyframing

To maintain object permanence for the LLM without exceeding token context limits via raw coordinate bloat, spatial continuity relies on semantic relationships rather than absolute Cartesian geometry. The Sieve groups tokens logically, establishing a mental map for the LLM that updates only upon meaningful positional shifts.

#### 3.1 The Cast List

At the very beginning of the dense notation export, the Sieve generates a strict Cast List preamble. This explicitly maps token references to their visual and contextual descriptors, providing the LLM with a locked, persistent visual reference for all participants, whether active or inactive in a given phase.

- **Format:** `[Cast: {Token_Ref}] {Name} ({Race} {Profession}) - {Key Visual Descriptors/Equipped Gear}`
- **Example:** `[Cast: PC1] Gimli (Dwarf Fighter) - Heavy chainmail, battleaxe, scarred face.`

#### 3.2 Round Keyframes (The Stage Layout)

Instead of capturing spatial data every phase, the system captures a "Stage Layout" snapshot exclusively at the top of each new Combat Round. Tokens are calculated and grouped into relative **Semantic Zones**.

- **Zone Definitions:** Zones are calculated dynamically by the Sieve based on clusters of engaged tokens and their relative grid distances from the primary encounter locus. Standard classifications include:
  - `[Zone: Melee Centre]` (Actively engaged in close combat)
  - `[Zone: Periphery]` (Nearby, maneuvering, or casting)
  - `[Zone: Distant Cover]` (Ranged combatants, hidden tokens)
- **Format:** `[Round: X, Stage Layout] [Zone: {Name}] {Token_Ref}, {Token_Ref}`
- **Example:** `[Round: 2, Stage Layout] [Zone: Melee Centre] PC1, NPC2. [Zone: Distant Cover] PC2.`

#### 3.3 Dynamic Movement and State Logging

During the individual combat phases, spatial updates are inherently event-driven. They are only logged into the timeline if a token meaningfully changes its semantic state (e.g., breaking engagement, shifting zones, or changing posture). Minor grid-square adjustments within the same semantic zone are intentionally filtered out to minimise noise.

- **Engagement Shifts:** Logging when a token traverses the established zones or gains a tactical advantage.
  - **Example:** `[Phase: 2] [Movement] PC2 shifts from [Zone: Periphery] to [Zone: Melee Centre] (Flanking NPC2).`
- **Status Changes:** Logging critical physical states that dictate visual representation in the panel.
  - **Example:** `[Phase: 3] [State] NPC2 is knocked [Prone] and [Bleeding].`

### 4. Guided Wizard: The Hybrid Curation Model

The GM interface balances automated prompt generation with lightweight, capped editorial control to ensure table-specific memories are captured.

#### 4.1. Configuration & Context

- **Log Selection:** The Wizard queries the world for JournalEntry documents flagged by the Narrator module and presents them in a dropdown. Selecting a log loads its timeline.
- **Director's Setup:**
  - **Page Count Target:** A numeric input defining the desired script length.
  - **Atmosphere & Context:** A text area for the global primer (e.g., "Dark, gritty, mud-soaked clearing within a dense forest. The party is exhausted and fighting for their lives.").
  - **Cast:** Text areas for each token where the GM inputs brief visual descriptors to ensure visual continuity (to supplement data captured from the token/actor document).

#### 4.2. The Highlight Reel (Interactive Curation)

Instead of manually typing notes, the GM is presented with a streamlined, human-readable timeline of the combat.

- **Data Binding:** The ApplicationV2 interface renders the raw event data array through a Handlebars template, translating mechanical data into simple, readable strings (e.g., "Round 2: Gimli attacks Orc 1").
- **Capped Selection:** Each event features a simple checkbox toggle. The GM is instructed to select their "Hero Moments."
- **Validation Logic:** To maintain low cognitive complexity and prevent prompt dilution, the UI enforces a strict selection limit dynamically tied to the `Page Count Target` (e.g., a maximum of 2 selections per requested page).

#### 4.3. Compilation & Handoff

- **State Mutation:** Selected items simply have a boolean flag (e.g., `isHighlighted: true`) appended to their data object in memory.
- **Dense Notation Sieve:** During final export, the Sieve injects the `!` (Hero Moment) flag into the dense notation *only* for the objects containing this boolean state.
- **LLM Instruction:** The system prompt explicitly instructs the LLM: *"Events marked with a `!` are director-mandated highlights. You must build your panel pacing around these specific moments, giving them visual priority. Use your own judgment to condense the unmarked mechanical events to connect these highlights organically."*
- **The Copy Handoff:** The Wizard does not export a file. It renders the final, formatted LLM prompt into a read-only, monospaced `<textarea>` equipped with a native "Copy to Clipboard" button.

## 5. Roadmap Options

Rather than export a prompt, game settings can be used to define and register an LLM API which can be called from within the Wizard, applying appropriate levels of security for API keys, etc.

## 6. Implementation Plan

### Phase 1: The Scaffolding & View Layer (Actionable Today)

This phase builds everything from the GM's perspective backwards. By the end of this phase, we will have a fully functional Guided Wizard that renders mock data, allows editorial interaction, and successfully compiles the final LLM prompt.

#### 1.1 Initialisation & Mock Data Handoff

- **The Manifest:** Set up the `module.json` ensuring strict compatibility with v13+ Foundry VTT.
- **The Dummy Payload:** Define a pure JavaScript object array representing a completed combat encounter. This will contain dummy tokens, semantic zones, and a mix of standard attacks, fumbles, spells, resistances, spell failures, and lethal blows.
- **The Mock Journal:** Create a simple initialisation script that injects this dummy payload into a temporary `JournalEntry` so we have something native to query.

#### 1.2 The ApplicationV2 Guided Wizard

- **The Class Structure:** Build the `ApplicationV2` class extension. Define the window dimensions, window controls, and default states.
- **The View (HTML/HBS):** Write the Handlebars template for the Wizard. This includes the Director's Setup inputs and the iterative loop that renders the human-readable timeline.
- **Styling (CSS):** Write the module-scoped CSS using `rem` units, ensuring the layout remains clean and readable.
- **Localisation (`en.json`):** Map all UI strings, button labels, and error toasts to flattened keys.

#### 1.3 The Interactive Curation Logic

- **State Mutation:** Write the pure, single-purpose helper functions that handle the checkbox toggles.
- **Guard Clauses:** Implement the logic to count selected "Hero Moments" against the dynamically calculated limit (based on the GM's page count input), and prevent return until excess selections are removed (triggering localisation toasts).

#### 1.4 The Dense Notation Sieve (The Compiler)

- **The Exporter:** Write the highly isolated compiler function. It will take the final, curated JavaScript object array and iterate through it.
- **Formatting Logic:** Build the string concatenation rules that output the `[Zone: X]`, `!!`, `^`, and `!` notations based strictly on the object properties.
- **The Handoff:** Render the final compiled string into the read-only `<textarea>` within the Wizard, complete with the native copy-to-clipboard functionality.

### Phase 2: Ingestion & Persistence (Pending System Hooks)

Once the system developer provides the RMU event hooks, we discard the mock data and wire up the live system.

#### 2.1 The RMU Adapter Class

- **Hook Registration:** Set up listeners for the specific system events (e.g., `rmu.attackRoll`, `rmu.applyDamage`).
- **Data Translation:** Write the mapping functions that take the proprietary RMU hook arguments and flatten them into our standardised "Narrator JSON" schema.

#### 2.2 Storage in Motion

- **State Management:** Implement the logic to push the translated events into `combat.setFlag('rmu-narrator', 'eventLog', eventData)`.
- **Race Condition Handling:** If necessary, add a lightweight debounce or queuing mechanism to ensure concurrent hooks log sequentially.

#### 2.3 The Lifecycle Handoff

- **Combat End Hook:** Listen for the `deleteCombat` hook.
- **Journal Creation:** Extract the completed flag array, programmatically generate the new `JournalEntry`, and surface the UI prompt asking the GM if they wish to open the Narrator Wizard.

## 7. Hooks

As the system developer published hooks, they will be added here.

Hooks are called from `rmu-journaling.js`.

### 7.1 Attack Hook: `rmu.attack`

> Note: In its initial implementation this does not yet take account of any target `immunities`, `vulnerabilities`, or `proof-against-[type]` properties on the defender token.

```javascript
@typedef {{
attackerTokenId: number,
defenderTokenId: string,
action: {
actionType: 'Melee' | 'Ranged' | 'Thrown' | 'Unarmed' | 'AoE',
attackName: string,
attackTableName: string,
},
attackResult: string,  // such as '22 EK'
attackRoll: Roll,
statuses: [
'Open End Down' | 'Open End Up' | 'Fumble' | 'Hit' | 'Miss' | 'Critical Hit' | 'Natural 66' | 'Breakage'
],
location: null | {
location: string,
side: string,
},
effects: [{ name: string, description: string | null}]
}}
```

### 7.2 Spell Casting Roll Hook (`rmu.scr`)

```javascript
@typedef {{
attackerTokenId: string,
defenderEffectsArray: null | [   // populated for utility spells that have effects like heal hp, reduce stun, etc
{
id: string,
effects: [
{
name: string,  // you can see 'heal-hits', 'heal-stun', 'heal-fatigue', 'roll-critical'
description: string | null,
}]
}
],
action: {
actionType: 'SCR',
},
spell: any,  // Full spell detail
scrRoll: Roll,
statuses: [
'Open End Down' | 'Open End Up' | 'Spellcasting Success' | 'Spellcasting Failure'  | 'Resistible' | 'Utility'
],
realms: ['Channeling' | 'Essence' | 'Mentalism' | 'Fear' | 'Physical']
}}
```

### 7.3 Resistance Roll Hook (``)

```javascript

```
