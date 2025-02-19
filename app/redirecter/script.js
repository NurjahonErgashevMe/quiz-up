const { ipcRenderer } = require('electron');

document.getElementById('results-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'information');
});

document.getElementById('upload-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'upload');
});

document.getElementById('back-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'admin');
}); 