'use strict';
const electron = require('electron');

const app = electron.app;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 1200,
		height: 800,
        webPreferences: {
            webSecurity: false
        },
        autoHideMenuBar: true
	});

    // https://electron.atom.io/docs/api/web-contents/#contentsinsertcsscss
    const FS = require('fs');
    const base_codemirror_dir = `${__dirname}/../node_modules/codemirror/`
    const codemirror_base_css = FS.readFileSync(base_codemirror_dir + 'lib/codemirror.css', 'utf8');
    const codemirror_theme_css = FS.readFileSync(base_codemirror_dir + 'theme/neo.css', 'utf8');
	win.loadURL(`file://${__dirname}/../main.html`);
    win.webContents.on('did-finish-load', function() {
        win.webContents.insertCSS(codemirror_base_css);
        win.webContents.insertCSS(codemirror_theme_css);
    });
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
