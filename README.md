# RMU Combat Storyboard

![Latest Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Foundry Version](https://img.shields.io/badge/Foundry_VTT-v14_%7C_v14-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)
![RTL Support](https://img.shields.io/badge/RTL-Supported-green)
![Download Count](https://img.shields.io/github/downloads/Filroden/rmu-combat-storyboard/rmu-combat-storyboard.zip)
![Download Count](https://img.shields.io/github/downloads/Filroden/rmu-combat-storyboard/latest/rmu-combat-storyboard.zip)
![Last Commit](https://img.shields.io/github/last-commit/Filroden/rmu-combat-storyboard)
![Issues](https://img.shields.io/github/issues/Filroden/rmu-combat-storyboard)

## Welcome to RMU Combat Storyboard

This module is designed exclusively for the Rolemaster Unified (RMU) system.

Rolemaster combats are famously detailed, featuring highly tactical phases, specific hit locations, and devastating critical injuries. The **RMU Combat Storyboard** is a GM utility that captures this rich mechanical data and translates it into a highly compressed, token-efficient prompt designed for external Large Language Models (LLMs like ChatGPT, Gemini, or Claude).

The result? Raw combat logs are transformed into cinematic, multi-page comic book scripts and detailed image generation prompts, allowing you to immortalise your group's most epic battles.

See an end-to-end example here: [Example 1](docs/example01.md)

> **Note:** This module does not contain any AI functionality itself, but is designed to work with external AI services.

## Key features

- **Silent Hook Ingestion:** Automatically captures attacks, spells, resistance rolls, and applied damage during combat, saving them to a Journal Entry.
- **The Storyboard Wizard:** A dedicated UI accessible from the Combat Tracker sidebar to review your combat highlight reel.
- **Cast & Roster Management:** Define the visual descriptions of your combatants and the environment to ensure AI consistency.
- **Hero Moments:** Flag specific attacks or critical hits to guarantee they become the focal point of the generated story.
- **Plain Text Export:** For GMs who just want a clean, human-readable summary of the battle without using AI, the module provides a one-click downloadable text log.

## How to use (inside FoundryVTT)

1. **Run Your Combat:** Play out your RMU encounter normally. When the combat ends, you (GMs only) will be prompted to save the raw event log to a Journal Entry.
2. **Open the Wizard:** Click the Storyboard Wizard icon (the crossed swords) located at the top of the Combat Tracker sidebar.
3. **Configuration Tab:** * Select your saved combat log from the dropdown menu.
    - Choose an **Art Style** (e.g., Dark & Gritty, 1980s Retro, Manga).
    - Set a **Target Page Count** to dictate the length of the final comic.
    - Provide a brief **Campaign Context** (e.g., "A rainy night in a muddy forest clearing") to ground the AI.

   ![Configuration Tab](https://github.com/Filroden/rmu-combat-storyboard/blob/main/screenshots/configuration_tab.png)

4. **Cast & Roster Tab:** Review the combatants. Replace their mechanical names with physical descriptions (e.g., "A small halfling wearing soft leather"). This allows the AI to visualise the combatants better.

   > **Note**:  If the combatant is a fantastical or unusual creature or race, you should provide a short description, e.g., "A medium sibbicai ranger. Sibbicai have the head of a jackal on humanoid shaped bodies. Their skin is covered in smooth, oily black short hair coats."

   ![Cast & Roster Tab](https://github.com/Filroden/rmu-combat-storyboard/blob/main/screenshots/roster_tab.png)

5. **Highlight Reel Tab:** Review the timeline of the battle. Check the **Hero Moment** box next to the most important actions to guarantee they receive a massive spotlight panel in the final script. You can also download a human-readable text file of the log from here.

   > **Note**: Use the **Hero Moment** boxes sparingly to avoid confusing the AI. Ideally, you should select one hero moment for each page and avoid choosing them too close together in the sequence of events.

   ![Highlight Reel Tab](https://github.com/Filroden/rmu-combat-storyboard/blob/main/screenshots/highlight_reel_tab.png)

6. **Export Prompt Tab:** The module compiles your entire curated battle into a dense, token-optimised code block. Click **Copy to Clipboard**.

   ![Export Prompt Tab](https://github.com/Filroden/rmu-combat-storyboard/blob/main/screenshots/export_prompt_tab.png)

## How to use (external LLM workflow)

Because modern AI models perform best when their attention isn't split, this module separates the roles of the **Writer** (generating the story) and the **Artist** (generating the images).

### Step 1: Generate the script and image prompts

Paste the copied prompt from the "Export Prompt" tab into your preferred text-based LLM AI (such as ChatGPT, Gemini, or Claude).

The AI will process the dense mechanical notation, follow the layout rules included by the module, and output a formatted comic book script for you to read, complete with camera angles and sound effects.

### Step 2: Generate the art using an AI image-generation model

The AI will also generate image prompts inside code block labeled `Image Prompt: Page X` for each page.

Copy these blocks *one by one* and paste them back into an image-generation model (like ChatGPT Plus/DALL-E 3, Gemini Pro, or Midjourney). The prompt has already been sanitised of game mechanics and character names, forcing the image model to strictly draw the visual action in your chosen art style.

### Step 3: Consider commissioning hand-drawn images

If the combat was truly epic, consider commissioning hand-drawn images. The FoundryVTT Discord has an `#artist-commissions` channel here: [FoundryVTT #Artist Commissions](https://discord.com/channels/170995199584108546/1154878920412373052). There are many other websites where you can find artists willing to create images for you.

## Important note on localisation

The RMU Combat Storyboard is fully translation-ready and supports RTL layouts. However, when working with the exported AI prompt, you will notice a specific architectural design: **Mixed-Language Prompting.**

- **The System Instructions are always in English.** To ensure the LLM strictly follows complex logical constraints (like preventing meta-commentary, parsing system mechanics, and formatting image prompts), the core rules are hardcoded in English, which matches the bulk of the LLM's training data.
- **The Output will be in your language.** The prompt automatically detects your Foundry VTT language setting and issues an instruction to the AI. The LLM will read your localised Campaign Context, process the English rules, and output the final cinematic comic script in your chosen language.

## Roadmap Ideas (no promises)

- Convert token dimensions into a size descriptor in the roster description, e.g., "medium-sized"
- Detect best armour type being worn and convert it to a simple, e.g., ", wearing soft leather armor" in the roster description
- Add a "Has Shield" checkbox and convert it to a simple, e.g., ", carrying a shield"
- Add an Advanced option to include filenames for the roster actors and change the resulting prompt to reference the filenames, so you can attach portrait images to your image generation prompts to improve the quality
