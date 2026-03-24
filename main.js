const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Characters folder sits next to the app entry point
const CHARS_DIR = path.join(__dirname, 'characters');

function ensureCharsDir() {
  if (!fs.existsSync(CHARS_DIR)) fs.mkdirSync(CHARS_DIR, { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Character Vault',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('src/index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => { ensureCharsDir(); createWindow(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── AUTO-BACKUP ──────────────────────────────────────────────────────────────
const BACKUPS_DIR = path.join(__dirname, 'backups');
const BACKUPS_KEEP = 14;

app.on('before-quit', () => {
  try {
    ensureCharsDir();
    const files = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.json'));
    if (!files.length) return;
    const characters = [];
    for (const file of files) {
      try { characters.push(JSON.parse(fs.readFileSync(path.join(CHARS_DIR, file), 'utf8'))); } catch(e) {}
    }
    if (!characters.length) return;
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(path.join(BACKUPS_DIR, `backup-${stamp}.json`), JSON.stringify(characters, null, 2), 'utf8');
    // Prune oldest backups, keep last BACKUPS_KEEP
    const all = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('backup-') && f.endsWith('.json')).sort();
    if (all.length > BACKUPS_KEEP) {
      all.slice(0, all.length - BACKUPS_KEEP).forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch(e) {}
      });
    }
  } catch(e) {
    console.error('Auto-backup failed:', e.message);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── CLIPBOARD ────────────────────────────────────────────────────────────────
ipcMain.handle('write-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

// ─── FILE STORAGE ─────────────────────────────────────────────────────────────

// Load all character files — returns array of character objects
ipcMain.handle('load-characters', () => {
  ensureCharsDir();
  try {
    const files = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('.json'));
    const characters = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(CHARS_DIR, file), 'utf8');
        const c = JSON.parse(raw);
        characters.push(c);
      } catch(e) {
        console.error('Failed to parse', file, e.message);
      }
    }
    return characters;
  } catch(e) {
    return [];
  }
});

// Save a single character to its own file
ipcMain.handle('save-character', (event, character) => {
  ensureCharsDir();
  try {
    const filename = sanitizeFilename(character.name || 'unnamed') + '_' + character.id + '.json';
    const filepath = path.join(CHARS_DIR, filename);
    // Remove any old file for this character id (name may have changed)
    const existing = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('_' + character.id + '.json'));
    existing.forEach(f => {
      if (f !== filename) fs.unlinkSync(path.join(CHARS_DIR, f));
    });
    fs.writeFileSync(filepath, JSON.stringify(character, null, 2), 'utf8');
    return true;
  } catch(e) {
    console.error('save-character error', e.message);
    return false;
  }
});

// Delete a character file
ipcMain.handle('delete-character', (event, characterId) => {
  ensureCharsDir();
  try {
    const files = fs.readdirSync(CHARS_DIR).filter(f => f.endsWith('_' + characterId + '.json'));
    files.forEach(f => fs.unlinkSync(path.join(CHARS_DIR, f)));
    return true;
  } catch(e) {
    console.error('delete-character error', e.message);
    return false;
  }
});

// Save all characters at once (for import)
ipcMain.handle('save-all-characters', (event, characters) => {
  ensureCharsDir();
  try {
    characters.forEach(c => {
      const filename = sanitizeFilename(c.name || 'unnamed') + '_' + c.id + '.json';
      fs.writeFileSync(path.join(CHARS_DIR, filename), JSON.stringify(c, null, 2), 'utf8');
    });
    return true;
  } catch(e) {
    console.error('save-all-characters error', e.message);
    return false;
  }
});

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 40);
}
