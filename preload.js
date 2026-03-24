const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeClipboard:     (text)       => ipcRenderer.invoke('write-clipboard', text),
  loadCharacters:     ()           => ipcRenderer.invoke('load-characters'),
  saveCharacter:      (character)  => ipcRenderer.invoke('save-character', character),
  deleteCharacter:    (id)         => ipcRenderer.invoke('delete-character', id),
  saveAllCharacters:  (characters) => ipcRenderer.invoke('save-all-characters', characters)
});
