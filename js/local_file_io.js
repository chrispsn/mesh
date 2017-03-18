const CSV_Reader = require('babyparse');    
const FS = require('fs');
const Path = require('path');

// On options for local storage in electron:
// http://stackoverflow.com/questions/30465034/where-to-store-user-settings-in-electron-atom-shell-application
// http://stackoverflow.com/questions/4692245/html5-local-storage-fallback-solutions

// On options for opening a load file dialog:
// https://github.com/electron/electron/blob/master/docs/api/dialog.md

const load_CSV = function (filepath, options) {
    // Also try https://www.npmjs.com/package/javascript-csv
    // (Usage: http://evanplaice.github.io/jquery-csv/examples/basic-usage.html)
    // in case its syntax is better
    const csv_text = FS.readFileSync(filepath, {encoding: 'utf8'})
    return CSV_Reader.parse(csv_text, options).data;
}

const Electron = require('electron').remote
const get_saveas_filepath = () => { return Electron.dialog.showSaveDialog() }

// Previously used localStorage, but that fails if we abstract out this API
// and I couldn't be bothered to figure out how to get it working again
const Config = require('electron-config');
const config = new Config();

module.exports = {
    readFileSync: FS.readFileSync,
    writeFile: FS.writeFileSync,
    load_CSV: load_CSV,
    get_saveas_filepath: get_saveas_filepath,
    load_setting: config.get,
    save_setting: config.set,
    get_basename_from_path: Path.basename
}
