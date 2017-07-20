const LINE_SEPARATOR = "\n";
// Alt: https://nodejs.org/api/os.html#os_os_eol

const WELCOME_MESSAGE = (
    "Welcome to Mesh!" + LINE_SEPARATOR + LINE_SEPARATOR
    + "Mesh is a grid-based IDE for JavaScript." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Changes in the grid will change your code." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Move around the grid using arrow keys or Ctrl + (h, j, k, or l)." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Add cell contents by typing normally, or edit existing contents with F2." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Press Enter or Tab to commit your change, or Esc to throw it away." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Open a file using Ctrl-o." + LINE_SEPARATOR
    + "Save a file using Ctrl-s." + LINE_SEPARATOR + LINE_SEPARATOR
    + "And F5 will reload the app, throwing away any unsaved changes." + LINE_SEPARATOR + LINE_SEPARATOR
    + "If you hit bugs, press Ctrl-Shift-i to open the Developer Tools and let me know what you see in the Console tab." + LINE_SEPARATOR + LINE_SEPARATOR
    + "Chris Pearson"
)

module.exports = {
    LINE_SEPARATOR,
    WELCOME_MESSAGE
}
