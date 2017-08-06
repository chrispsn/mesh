// On options for local storage in electron:
// http://stackoverflow.com/questions/30465034/where-to-store-user-settings-in-electron-atom-shell-application
// http://stackoverflow.com/questions/4692245/html5-local-storage-fallback-solutions

// On options for opening a load file dialog:
// https://github.com/electron/electron/blob/master/docs/api/dialog.md

const FS = require('fs');

const io_available = !(Object.keys(FS).length === 0);

if (io_available) {
    const Electron = require('electron').remote
    const get_saveas_filepath = () => Electron.dialog.showSaveDialog();
    const Path = require('path');
    module.exports = {
        io_available: io_available,
        readFileSync: FS.readFileSync,
        writeFile: FS.writeFileSync,
        get_saveas_filepath: get_saveas_filepath,
        // TODO don't seem to use the following function - remove?
        get_basename_from_path: Path.basename,
    }
} else {
    console.log("NO IO AVAILABLE");
    module.exports = {
        io_available,
    }
}
