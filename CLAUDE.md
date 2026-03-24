# Character Vault — Project Guide for Claude Code

## What this is
An Electron desktop app for play-by-post (PBP) RPG players. It manages multiple characters across multiple games, assembles context-efficient prompts for claude.ai, and tracks post history. The user copies the generated prompt, pastes it into a new claude.ai chat, then pastes the response back into the app to log it and update character state.

## Project structure
```
PBP/
├── main.js          — Electron main process: window, IPC, file storage
├── preload.js       — Context bridge: exposes electronAPI to renderer
├── package.json     — Electron dependency
├── CLAUDE.md        — This file
├── characters/      — One JSON file per character (auto-created on first run)
└── src/
    └── index.html   — Entire UI: HTML, CSS, and JS in one file
```

## Architecture decisions
- **Single file renderer**: All UI lives in `src/index.html`. No build step, no bundler.
- **File-based storage**: Each character is saved as `CharacterName_id.json` in the `characters/` folder. localStorage is used only as a migration fallback for users upgrading from older versions.
- **No API calls from the app**: The app builds and copies prompts to clipboard. The user pastes into claude.ai manually. There is no Anthropic API key in this app.
- **IPC handlers in main.js**: `load-characters`, `save-character`, `delete-character`, `save-all-characters`, `write-clipboard`
- **electronAPI in preload.js**: `loadCharacters`, `saveCharacter`, `deleteCharacter`, `saveAllCharacters`, `writeClipboard`

## Character data schema
```json
{
  "id": "timestamp string",
  "name": "Character name",
  "game": "Game or campaign name",
  "system": "Game system e.g. Through the Breach",
  "voice": "Compressed voice/personality note, max 600 chars",
  "relationships": "Short list of key relationships",
  "lore": [
    { "name": "Topic name", "text": "What this character knows" }
  ],
  "scene": "Current scene/location/mood, max 400 chars",
  "recentEvents": "2-3 bullet points of recent events, max 400 chars",
  "notes": "Scratch pad — never sent to Claude",
  "history": [
    { "date": "23 Mar 2026", "direction": "Short direction summary", "post": "Full post text" }
  ]
}
```

## Prompt assembly (buildSystemPrompt + buildFullPrompt in index.html)
The system prompt includes: character identity, voice, relationships, current scene, recent events, any toggled lore snippets, writing rules, and PBP etiquette rules. The user message includes: recent forum posts, direction, and optional tone notes. These are assembled and copied to clipboard.

## Writing rules baked into every prompt
These are non-negotiable and must be preserved in any edits to `buildSystemPrompt`:
- Third-person limited point of view
- Show internal state through action and sensation, not declaration
- Match the tone of the forum context provided
- Do not summarise — write the actual post
- End at a natural beat

## PBP etiquette rules baked into every prompt
These are absolute and must be preserved in any edits to `buildSystemPrompt`:
- REACTIVE ONLY: React only to information already in the forum posts. Never invent new facts, NPCs, locations, or events.
- NO GODMODDING: Never write the actions, words, thoughts, or reactions of other players' characters or GM NPCs. This character only.
- NO OUTCOMES: Never determine success or failure. Write the attempt only. The GM decides what happens.
- NO NEW INFORMATION: Do not add backstory or lore not already in the character sheet or forum posts.
- PUNCTUATION: Never use em dashes or double hyphens. Use commas, semicolons, colons, and full stops correctly. There is always a better construction than a dash.

## UI structure
- **Sidebar**: Character list, Export/Import buttons, Extraction Prompt button
- **Write Post tab** (default): 3-step flow — (1) context display with lore toggles, (2) forum context + direction + tone + Build & Copy Prompt button, (3) paste response + Log Post & Update State button
- **Character tab**: Identity fields, voice, relationships, live state (scene + recent events), delete button
- **Lore tab**: Named snippets, add/remove
- **Notes tab**: Free-form scratch pad, never included in prompts
- **History tab**: Last 10 logged posts, most recent first, each copyable

## Key UX rules to preserve
- After saving a post (Log Post & Update State → Save & Close), the post form clears completely: forum context, direction, tone notes all reset to empty.
- The state update modal is mandatory after logging a post — it cannot be skipped once initiated.
- Character limits: voice 600 chars (soft warning at 80%), scene 400 chars, recent events 400 chars. Warnings shown, not hard blocks.
- History keeps last 10 posts per character. Oldest drops off automatically.
- Export saves the full characters array as a dated JSON file. Import accepts both vault exports (array) and single-character extraction outputs (object).

## Extraction prompt
The "Get Extraction Prompt" button in the sidebar shows a copyable prompt that instructs Claude or ChatGPT to output a character as a single JSON object matching the schema above. The importer normalises this format on load.

## Aesthetic
Parchment and gold. Dark ink. Cinzel (serif display) for headings and labels. Crimson Pro for body text. The app should feel like a leather-bound journal, not a SaaS dashboard. Colours are hardcoded CSS variables in `:root` — do not introduce Tailwind or external CSS frameworks.

## What the user's primary character looks like (for reference)
The main character in development is **Thraeven**, a psionic investigator for Through the Breach (Malifaux setting). He cannot turn off his psionic sense, is exhausted by constant awareness of deception, has cold contempt for manipulation (not people), uses short direct sentences, never rhetorical questions, never "I feel", and deploys silence as punctuation. His monocle going on/off is a deliberate beat. He enters spaces by standing in the doorway first. He is ruthless only within the law and keeps a private journal of every use of his power.

## Development workflow
- All three files are interdependent. When adding a new feature that requires IPC, update main.js (handler), preload.js (bridge), and index.html (call site) together.
- Test JS syntax in index.html with: `node -e "const fs=require('fs');const c=fs.readFileSync('src/index.html','utf8');const s=c.indexOf('<script>');const e=c.lastIndexOf('</script>');try{new Function(c.slice(s+8,e));console.log('OK');}catch(ex){console.log('ERROR:',ex.message);}"`
- The characters/ folder is gitignored by convention — it contains user data, not source code.
- Never use template literal backticks inside Python string replacement scripts — they break the JS. Use direct file writes instead.
