# PlayWrite — Character Vault

A desktop app for play-by-post (PBP) RPG players. It manages your characters across multiple games, assembles context-efficient prompts for claude.ai, and keeps a logged history of every post.

---

## What it does

Play-by-post writing relies on keeping a consistent character voice across sessions that may be days apart. PlayWrite solves the context problem: instead of copy-pasting character notes into every AI chat, it stores everything in one place and builds a precisely structured prompt on demand.

**The loop:**
1. Open the character you're writing for
2. Paste the recent forum posts and write a brief direction
3. Click **Build & Copy Prompt** — the full prompt goes to your clipboard
4. Open a new [claude.ai](https://claude.ai) chat and paste it
5. Copy Claude's response, paste it back into PlayWrite
6. Click **Log Post & Update State** — the post is saved to history and the character's scene and recent events are updated automatically

No API key required. The app never connects to the internet.

---

## Setup

### Requirements
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)

### Install

```bash
git clone https://github.com/8w-gremlin/PlayWrite.git
cd PlayWrite
npm install
```

### Run

```bash
npm start
```

The app opens as a desktop window. Your character data is saved locally in a `characters/` folder next to the app.

---

## Interface overview

### Sidebar
- Lists all characters, grouped by **game system** (e.g. D&D 3.5, Pathfinder, Through the Breach)
- Click a group header to collapse or expand it
- Hover a character to reveal **▲▼** buttons for reordering within a system group
- **+ New Character** — create a blank character
- **Export / Import** — save or load the full vault as a JSON file
- **Get Extraction Prompt** — generates a prompt you can use to pull a character out of an existing AI chat

### Tabs (per character)

| Tab | Purpose |
|---|---|
| **Write Post** | The main workflow — build and copy prompts, paste and log responses |
| **Character** | Identity fields, voice, relationships, and live state |
| **Lore** | Named knowledge snippets you can toggle into individual posts |
| **Notes** | A private scratch pad — never included in prompts |
| **History** | Last 10 logged posts, most recent first, each copyable |

---

## Writing a post (step by step)

### Step 1 — Review context
The Write Post tab shows a summary of what will be in the prompt: the character's voice, current scene, recent events, and any lore snippets. Toggle lore snippets on or off for this post using the pill buttons. The token estimate updates as you do.

### Step 2 — Build & Copy Prompt
- **Forum context** — paste the last 1–3 forum posts from the thread
- **Your direction** — a brief note to yourself about what this character does next (e.g. *Thraeven enters and clocks that someone is lying. He doesn't announce it.*)
- **Tone / length notes** (optional) — e.g. *Keep under 200 words, heavy on internal monologue*

Click **Build & Copy Prompt**. Open a new claude.ai chat and paste.

### Step 3 — Log the response
Once Claude has written the post, copy its full response and paste it into the **Paste Claude's Response** box. A live word and character count shows at the bottom right.

Click **Log Post & Update State →**

An update modal opens. If Claude followed the output format, the **Scene** and **Recent Events** fields will be pre-filled from the response — review them and adjust as needed, then click **Save & Close**.

The post is added to History. The form clears ready for the next session.

---

## Character fields

### Identity
| Field | Notes |
|---|---|
| **Name** | Used as the character identifier |
| **Game / Campaign** | The specific campaign title (shown as subtitle in sidebar) |
| **System** | The game system — this controls sidebar grouping (e.g. `D&D 3.5`, `Pathfinder`, `Through the Breach`) |

### Voice & Personality
| Field | Limit | Notes |
|---|---|---|
| **Voice** | 600 chars | How this character thinks, speaks, and moves. Loaded into every prompt — keep it dense and specific. |
| **Key Relationships** | — | One line per person. Expand in Lore if a relationship needs more depth. |

### Live State
Updated after each post. Both fields are included in every prompt.

| Field | Limit | Notes |
|---|---|---|
| **Current Scene** | 400 chars | Where the character is, what the mood is |
| **Recent Events** | 400 chars | 2–3 bullet points of what just happened |

Character limits show a warning at 80% and turn red if exceeded. They are soft limits — the prompt will still build.

---

## Lore snippets

Named pieces of setting knowledge the character carries. Examples: *The Breach*, *Guild Politics*, *The Latigo Family*.

- Add snippets in the **Lore** tab — name and a short body
- Edit any snippet directly in place; changes save automatically
- On the Write Post tab, toggle snippets in or out per post using the pill buttons
- Only toggled-on snippets are included in the prompt

Use lore for context that is relevant to some posts but not all. Keep it dense — lore adds tokens.

---

## Prompt structure

Every prompt contains:

```
== CHARACTER ==
Name, Game, System

VOICE & PERSONALITY
RELATIONSHIPS

== CURRENT STATE ==
Scene / Location / Mood
Recent Events

== LORE == (only toggled snippets)

== WRITING RULES ==
== PBP ETIQUETTE — ABSOLUTE RULES ==

---

== RECENT FORUM POSTS ==
== DIRECTION ==
== NOTES == (optional)

== AFTER THE POST ==
(Instructions for Claude to output suggested state updates)
```

The etiquette rules baked into every prompt:
- **Reactive only** — no invented facts, NPCs, or locations
- **No godmodding** — only this character's actions and thoughts
- **No outcomes** — write the attempt, not the result
- **No new information** — nothing outside the character sheet or forum posts
- **No em dashes** — enforced punctuation discipline

---

## Import / Export

### Export vault
Click **Export** in the sidebar footer. Saves all characters as a dated JSON file (`character-vault-2026-03-24.json`). Keep this as a backup or to move between machines.

### Import
Click **Import** and select a JSON file. Accepts:
- A full vault export (array of characters)
- A single character extraction output (object)

Characters with matching IDs are updated in place. New characters are added.

### Extraction prompt
If a character already exists in an AI chat, use **Get Extraction Prompt**. Copy the prompt, drop it at the end of that chat, and ask Claude or ChatGPT to run it. Save the JSON output as a `.json` file and import it into the vault.

---

## Auto-backup

Every time you close the app, a backup of all characters is written to the `backups/` folder. Backups are named by timestamp (`backup-2026-03-24T14-30-00.json`) and the last 14 are kept. Both `characters/` and `backups/` are gitignored — they never leave your machine.

---

## Data storage

Characters are stored as individual JSON files in the `characters/` folder:

```
characters/
  Thraeven_1711234567890.json
  Mira_1711234567891.json
```

Filename format: `CharacterName_id.json`. If you rename a character the old file is replaced automatically.

---

## Project structure

```
PlayWrite/
├── main.js          — Electron main process: window, IPC, file storage, auto-backup
├── preload.js       — Context bridge: exposes electronAPI to renderer
├── package.json     — Electron dependency
├── CLAUDE.md        — Development guide for AI-assisted work
├── characters/      — One JSON file per character (gitignored)
├── backups/         — Auto-backups on quit (gitignored)
└── src/
    └── index.html   — Entire UI: HTML, CSS, and JS in one file
```
