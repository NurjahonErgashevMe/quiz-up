const { ipcRenderer } = require('electron');

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin') {
        ipcRenderer.send('navigate', 'upload');
    } else {
        document.getElementById('error-message').style.display = 'block';
        setTimeout(() => {
            document.getElementById('error-message').style.display = 'none';
        }, 3000);
    }
});

document.getElementById('back-button').addEventListener('click', () => {
    ipcRenderer.send('navigate', 'home');
});
