'use strict';

const FS = require('fs');
const Path = require('path');

// On options for local storage in electron:
// http://stackoverflow.com/questions/30465034/where-to-store-user-settings-in-electron-atom-shell-application
// http://stackoverflow.com/questions/4692245/html5-local-storage-fallback-solutions

// On options for opening a load file dialog:
// https://github.com/electron/electron/blob/master/docs/api/dialog.md

const Electron = require('electron').remote
const get_saveas_filepath = () => Electron.dialog.showSaveDialog();

module.exports = {
    readFileSync: FS.readFileSync,
    writeFile: FS.writeFileSync,
    get_saveas_filepath: get_saveas_filepath,
    get_basename_from_path: Path.basename
}
