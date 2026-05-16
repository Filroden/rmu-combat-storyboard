# Example: From combat to comic book

This page provides an end-to-end demonstration of the **RMU Combat Storyboard** module in action. We will take a raw, mechanically dense Foundry VTT combat encounter and transform it into a cinematic comic book sequence using external AI tools.

## 1. Setup (inside Foundry VTT)

The party has been ambushed on a coastal cliff. The combat features a halfling fighter, an elven mentalist, a ranger, a ghostly specter lord, and a massive brown bear.

After the combat concludes, we open the **Storyboard Wizard** from the Combat Tracker to configure our export:

* **Art Style:** Dark & Gritty
* **Target Pages:** 3
* **Campaign Context:** A small island dominated by a lighthouse overlooking a small cliff. To its side is a slope down to the beach and a small jetty. It is noon, the weather is clear and warm.

![Wizard Configuration](../[PATH_TO_YOUR_WIZARD_SCREENSHOT].png)
*The GM reviews the Cast & Roster, ensuring mechanical names are replaced with physical descriptions for the AI.*

## 2. The exported prompt

Once the highlight reel is curated, the module generates a highly compressed, token-optimised prompt.

<details>
<summary><strong>Click to expand the raw exported prompt</strong></summary>

```text
[Director's Instructions]
Target Length: Exactly 3 pages.
Output Language: You MUST write the final comic script (descriptions, captions, SFX) in the language corresponding to ISO code 'en'.
Layout Rules: Maximum 3 to 4 scene transitions per page. Present continuous, cinematic action. Maintain spatial continuity based on the Stage Layouts.
Script Scrubbing: You must completely DELETE the raw notation symbols (e.g., ^, v, !!, [!]) from your final text. Do not print them. Translate their meaning into natural words, but erase the symbols themselves.
No Meta-Commentary: NEVER break the fourth wall. Do not explain your stylistic choices, summarize your constraints, or mention these instructions. Do not include conversational filler, introductions, or concluding remarks. Output strictly the cinematic narrative and absolutely nothing else.

[Notation Legend]
The combat timeline uses the following shorthand:
- [!] (Hero Moment): This event MUST be the dominant, largest moment on its respective page. If multiple [!] events occur on the same page, you must either combine them into a single massive splash scene showing simultaneous action, or explicitly prioritize the one with the highest kinetic impact.
- ^ (Explosive Force): Emphasize overwhelming physical power and momentum.
- v (Catastrophic Momentum): Describe the character fighting their own momentum, slipping, or moving jarringly wrong.
- !! (Strange Fate): The action is uncanny, bizarre, or aesthetically eerie.

[Output Format]
For EVERY page, you must output exactly two sections:

**Script: Page X**
(Write the narrative script here for the GM. Format cameras and descriptions, but DO NOT use the word 'Panel' or write panel numbers.)

**Image Prompt: Page X**
\`\`\`
Generate an image for this comic page: 
dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders, [comma separated list of visual subjects, actions, and environment details for the entire page].
CRITICAL RULES: Do NOT draw any text, speech bubbles, sound effects, or panel numbers. Use strictly visual storytelling.
\`\`\`

Image Generation Rules:
1. Core Style: Enforce a dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere. Allow characters or weapons to break panel borders.
2. Environment Lock: Strictly maintain the exact weather, lighting, and background established in the [Campaign Context] across all pages.
3. Literal Translation: Do not pass game mechanics to the image generator. Translate concepts like 'Scene (Falling)' or 'Breakage' into literal, physical phenomena (e.g., crumbling cliff edges, snapping wood).
4. Focal Hierarchy (Anti-Bleed): To prevent entity hallucination, limit the prompt to a maximum of TWO highly detailed characters per panel (usually the attacker and primary target). For mass brawls or area attacks, render additional combatants purely as shadowy silhouettes, blurred foreground elements, or atmospheric background shapes.
5. Character Continuity: Use the Cast List for strict visual reference.
6. No Text Rule (Prompt Sanitization): Image generators will hallucinate proper nouns as floating text. You MUST completely strip all character names (e.g., "Felt", "Risato") and notation tags from the Image Prompt section. Replace character names with their physical descriptors from the Cast List (e.g., "a small halfling fighter"). The final prompt must describe purely visual elements.

[Campaign Context]
A small island dominated by a lighthouse overlooking a small cliff. To its side is a slope down to the beach and a small jetty. It is noon, the weather is clear and warm. The battle takes place between the lighthouse and the beach.

[Cast List]
[Cast: UVBqaYS6lkbHUDez] Brown Bear - Large Brown Bear
[Cast: x4G80wpERIxHRAb8] Furryear Loamtoe "Felt" - Small Halfling Fighter wearing soft leather armour
[Cast: buAsPOEjclC16Lhp] Risato Rozz - Medium Sibbicai Ranger wearing a soft leather tunic
[Cast: WqcEzAhnzIy8dJJE] Specter Lord - Medium Ghostly Specter Lord
[Cast: TcC22qhV1xLALsRP] Filroden Soulsong - Medium Fair Elf Mentalist wearing elven mail armour
[Cast: aog] Environment - Various environmental hazards, falling, traps, etc.

[Combat Timeline]
[Round: 1, Stage Layout] [Zone: Melee Skirmish 1] Brown Bear, Furryear Loamtoe "Felt" (Flying) [Zone: Periphery] Risato Rozz, Specter Lord, Filroden Soulsong
[Phase: 1.1] Filroden Soulsong => [AoE: 10'R] (Mentalism Spell (Mind Attack): Mind Shout I) Success (Resistible). Everyone except the caster within the radius is a target, all failing to resist are stunned (-50) for 1 Rd for every 10 RR failed.
[Phase: 1.1] Brown Bear -> Furryear Loamtoe "Felt" (Bite) (Miss).
[Phase: 1.1] Specter Lord => [AoE: 3 targets] (Elemental Ball) [Impacts: Furryear Loamtoe "Felt": 7 Hit Right Head. | Brown Bear: 13 AO (A-Cold, Knockback 10, Staggered 1) Hit Right Arm. You give foe the cold shoulder. | Filroden Soulsong: 6 Hit Right Arm.]
[Phase: 1.2] Risato Rozz => Brown Bear (Short Bow) 8 ZP (Z-Puncture, Injury). Hit Left Chest. Point tears through pectoral, bounces off bone.
[Round: 2, Stage Layout] [Zone: Melee Skirmish 1] Brown Bear, Furryear Loamtoe "Felt" (Flying) [Zone: Periphery] Risato Rozz, Specter Lord, Filroden Soulsong
[Phase: 2.2] Furryear Loamtoe "Felt" => Brown Bear (Spear, Smoke Hardened) ^ 17 CP (C-Puncture, Bleed 1, Injury, Stun 2). Hit Right Leg. Thrust to knee leaves that joint in a bad way.
[Phase: 2.2] Risato Rozz => Brown Bear (Short Bow) 20 DP (D-Puncture, Dying 8, Bleed 3, Injury, Fatigue, Stun 4, Breakage -25). Hit Left Abdomen. Strike sinks deep into foe's side, damaging intestines. Foe will die in 8 rounds.
[Phase: 2.2] Filroden Soulsong => [AoE: 1 target] (Mentalism Spell (Mind Attack): Paralyze I) v Failure. Target is paralyzed, unable to move or take any action.
[Phase: 2.2] Specter Lord => [AoE: 3 targets] (Elemental Ball) [Impacts: Furryear Loamtoe "Felt": 11 BO (B-Cold, Injury, Knockback 10, Staggered 1, Breakage -25) Hit Left Arm. Frostbite reaches fingers of cold deep into bicep. Foe recoils. | Brown Bear: 20 DO (D-Cold, Fatigue, Stun) Hit Left Abdomen. Foe shivers uncontrollably, dropping anything in his hands. | Filroden Soulsong: 9 YO (Y-Cold) Hit Left Abdomen.]
[Round: 3, Stage Layout] [Zone: Melee Skirmish 1] Brown Bear, Furryear Loamtoe "Felt" (Flying) [Zone: Periphery] Risato Rozz, Specter Lord, Filroden Soulsong
[Phase: 3.1] Risato Rozz => Specter Lord (Short Bow) (Miss).
[Phase: 3.1] Brown Bear -> Furryear Loamtoe "Felt" (Bite) (Miss).
[Phase: 3.2] Furryear Loamtoe "Felt" => Brown Bear (Spear, Smoke Hardened) 8 YP (Y-Puncture). Hit Right Arm.
[Phase: 3.2] Filroden Soulsong => [AoE: 1 target] (Mentalism Spell (Mind Attack): Paralyze I) Success (Resistible) [Saves: Specter Lord: Failed to Resist (paralyzed 6) Spell targets Right Leg.]. Target is paralyzed, unable to move or take any action.
```

</details>

## 3. Step 1: Generating the script

We take the exported prompt and paste it directly into our preferred text-based AI (e.g., ChatGPT, Claude, or Gemini). The AI parses the mechanics, applies our layout rules, and generates a cinematic script for the GM to read.

> **Note:** The AI automatically strips away the game mechanics and character names to prepare the image prompts for the next step.

### Output from the AI

*This example was from a free subscription to Claude AI.*

**Script: Page 1**

Noon sun blazes over the island. The lighthouse rises white and stark against the open sky, its shadow cutting a hard line toward the beach below. The slope from cliff to shore shimmers in the heat.

The elf mentalist — Filroden — stands at the periphery, one fist pressed to his temple, elven mail catching the light. His mouth opens wide in a soundless scream directed inward and outward at once. A visible ripple warps the air around him in a perfect ten-foot ring — a pressure wave of pure psychic force washing across the battlefield. Everyone within it flinches, staggers, or clutches their skulls. The brown bear wheels away from its halfling target, shaking its massive head in dazed confusion. The half-screamed cry of the bear blends with the crack of the mind shout breaking over the clearing.

CRACK — PSY-SHOUT

The Specter Lord materialises above the melee, translucent limbs trailing cold mist. Three orbs of pale elemental cold coalesce at its outstretched hands and detonate simultaneously. The small halfling fighter — Felt — airborne on some magic keeping her aloft — takes a glancing burst to the head, staggering mid-flight. The bear catches the brunt on its right forearm: frost blooms white and crystalline across its fur, and the sheer knockback rocks the great animal sideways. Filroden catches a smaller burst on his right arm, the cold slapping through his elven mail.

SHOOM — CRYO-BURST

The ranger Risato, crouched behind a crumbling chunk of cliff rock, draws and looses. The short bow sings. The arrow punches cleanly into the bear's left chest — the broadhead shreds through pectoral muscle, bounces off the rib beneath. The bear bellows.

THWK

---

**Image Prompt: Page 1**

```text
Generate an image for this comic page: 
dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders, a fair elven warrior in mail armour stands with fist pressed to temple, face contorted in psychic exertion, visible concentric ripple-waves of mind force radiating outward in a ten-foot ring, noon sun blazing above a coastal lighthouse on a small island cliff, a large brown bear reeling and shaking its head in disorientation, a small halfling fighter in leather armour hovering in mid-air as if magically borne aloft, a translucent ghostly wraith-lord manifesting above the battlefield with orbs of pale blue-white ice energy detonating between them, frost blooms crystalline across the bear's right forearm and knockback throws it sideways, a medium ranger in leather tunic crouched behind broken cliff rock loosing an arrow, broadhead arrow striking the bear's left chest, coastal beach and jetty visible in background below the cliff slope, clear warm noon sky, lighthouse looming white in upper distance.
CRITICAL RULES: Do NOT draw any text, speech bubbles, sound effects, or panel numbers. Use strictly visual storytelling.
```

---

**Script: Page 2**

The bear is bleeding now — two arrows buried in it — and its great body is tilted at an ugly angle, fighting its own weight. Still it lunges, jaws spread wide, snapping at the airborne halfling. She banks hard, and the bite closes on empty air.

Then Felt drives her smoke-hardened spear downward in a sweeping arc, all her momentum behind it. The tip plunges into the bear's right knee. The joint buckles. The animal's hind leg caves inward at an angle that makes the whole battle pause — a stillness before the bear's howl splits the noon air.

CRACK — SKEWER

Risato tracks, breathes, and fires again. This arrow finds the left abdomen: it doesn't bounce. It sinks. It keeps sinking. The bear's legs tremble. Its body shudders with the understanding of what has just been done to it. Its intestines are perforated somewhere deep inside, and the clock has started. Eight rounds until the great animal is gone.

SHUNK

This is the turning point of the page — the dominant moment rendered in full: the bear collapsing onto one damaged leg, the spear still jutting from its knee, the arrow buried hilt-deep in its side, and Risato still in her firing stance, the bow lowering, expression flat and certain.

Then the Specter Lord strikes again. Three more cold bursts scatter outward. One catches Felt on her left arm — frostbite claws deep into the bicep and she recoils violently through the air, the burn of cold going straight to the bone. The bear absorbs another on its left abdomen, so severe it shudders uncontrollably, dropping nothing because it holds nothing, simply seizing in the cold. Filroden catches the third on his own left abdomen — he grimaces but holds his ground.

And then Filroden tries his paralyze spell — reaching out with a precise psychic lance — but something goes wrong. He over-reaches, his own body lurching forward as the spell misfires, the mental construct collapsing before it reaches its target.

---

**Image Prompt: Page 2**

```text
Generate an image for this comic page: 
dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders, dominant focal image of a large brown bear collapsing onto one foreleg with a spear piercing its right knee joint at a grotesque angle and a deeply buried arrow shaft protruding from its left side, blood streaking its fur, a small halfling fighter in leather armour airborne above the bear mid-downward spear thrust breaking the panel border, a lean ranger in leather tunic in a low firing stance bow lowering expression cold and certain, a translucent ghostly wraith-lord above radiating three simultaneous cold energy bursts, the small airborne halfling recoiling hard to one side as frost blooms across her left arm bicep, the bear seizing and shuddering in extreme cold damage, a fair elven figure in mail armour stumbling forward with arms splayed as a psychic spell misfires and collapses, noon sun casting hard shadows across rocky coastal ground, lighthouse white against clear sky in background, beach and jetty below the cliff edge visible.
CRITICAL RULES: Do NOT draw any text, speech bubbles, sound effects, or panel numbers. Use strictly visual storytelling.
```

---

**Script: Page 3**

Round three. The battlefield has shifted — the bear is dying and it knows it. Its lunges are slower, heavier, its right knee dragging. It snaps again at the halfling with those massive jaws, and again she isn't there.

Risato draws on the Specter Lord instead — a difficult angle, moving target, ethereal form — and the arrow passes through its mist-body without purchase. The wraith drifts. It does not bleed.

Felt presses her advantage. She circles above the ruined bear and drives the spear again into its right arm, tearing through muscle and tissue. The wound is not a killing one — the killing has already been arranged — but it is methodical. The bear bleeds from three points now.

Then Filroden finds his focus again. He reaches out — quieter this time, precise, no theatrics — and the psychic lance settles on the Specter Lord. The wraith goes rigid. Its trailing limbs freeze in mid-drift. Its lower half — from the right leg upward — locks completely, locked in the invisible grip of a paralysis it cannot shake for six full rounds. The Specter Lord hangs in the noon air, helpless, a half-formed thing frozen between states. The lighthouse looms white above it all. The beach below is still. The tide moves in regardless.

This is the closing image: the spectral entity suspended and paralysed in the bright island air, the bear bleeding out across the sunlit rocks below, the battlefield's violence rendered in stark noon light with nowhere to hide. The halfling warrior holds her spear level, watching. The ranger is already nocking another arrow. The elf stands with two fingers raised, the spell still humming between them.

The island says nothing. The lighthouse says nothing. The war continues.

---

**Image Prompt: Page 3**

```text
Generate an image for this comic page: 
dark noir comic style, heavy black ink wash, chiaroscuro lighting, deep shadows, desaturated muted palette, rough crosshatching, dirty atmosphere, multi-panel comic page, dynamic overlapping gutters, elements breaking panel borders, a translucent ghostly wraith-lord entity suspended and completely rigidly paralysed in mid-air in bright noon light above a rocky coastal clearing, lower spectral limbs locked motionless as if seized by invisible force, a large brown bear dragging one hind leg across sunlit rock bleeding from multiple wounds arrow shafts in its side and a spear hole in its right arm barely lunging with heavy jaws at empty air, a small airborne halfling fighter in leather armour holding a spear level watching the wraith calmly, a lean ranger in leather tunic crouched on the slope below already nocking another arrow, a fair elven figure in mail armour standing with two fingers raised psychic energy faintly visible between them, the tall white lighthouse towering behind all figures against a clear warm blue sky, the rocky slope leading down to a calm beach and small wooden jetty in the far background, noon sun casting multiple hard shadows, stark contrast of violence in peaceful island setting.
CRITICAL RULES: Do NOT draw any text, speech bubbles, sound effects, or panel numbers. Use strictly visual storytelling.
```

## 4. Step 2: Generating the art (the artist)

The text AI also generated code blocks containing highly specific image prompts. We copy these blocks **one by one** and paste them into an image-generation AI (e.g., Midjourney, DALL-E 3, or Gemini) to create the final comic panels.

*These examples were from a paid subscription to Gemini Pro.*

### Page 1

![Page 1 Comic Art](https://github.com/Filroden/rmu-combat-storyboard/screenshots/Example01_Page_1_Comic_Art.png)

### Page 2

![Page 2 Comic Art](https://github.com/Filroden/rmu-combat-storyboard/screenshots/Example01_Page_2_Comic_Art.png)

### Page 3

![Page 3 Comic Art](https://github.com/Filroden/rmu-combat-storyboard/screenshots/Example01_Page_3_Comic_Art.png)
