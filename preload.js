const { contextBridge, ipcRenderer } = require('electron');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Экспорт API для сохранения файла
contextBridge.exposeInMainWorld('electronAPI', {
    xlsx, fs, path,
    saveFile: (grade, subject, fileBuffer) =>
        ipcRenderer.invoke('save-file', grade, subject, fileBuffer),
    navigate: (route) => ipcRenderer.send('navigate', route),
});
