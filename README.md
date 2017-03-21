# Mesh

Mesh is a JavaScript IDE that feels like a spreadsheet. 

Visualise data and edit code using similar patterns to what you'd use in a spreadsheet.

![screenshot](https://cloud.githubusercontent.com/assets/777010/24078505/9693f64e-0cc3-11e7-8b2e-0433483569ec.png)

## How to install Mesh

Install [Yarn](https://yarnpkg.com/en/docs/install) or the LTS version of [node.js](https://nodejs.org/en/download/).

Then, download the Mesh source. In the Mesh directory, at the command line, type `yarn` or `npm install` (as relevant) and press Enter.

Electron's install seems to be fiddly; you may need to delete the electron directory in node_modules and reinstall.

## How to start using Mesh

To launch Mesh, open a command line in the Mesh directory, type `yarn start` or `npm start` (as relevant) and press Enter.

To create a new file, just start moving the cursor around (keyboard: jkl;).

Take a look at the example in the examples directory too (keyboard: Ctrl-O).

Full shortcut information is displayed on startup.

## For programmers - understanding the files

A quick summary of Mesh workflow:

- user edits their JavaScript file, either by making changes in the formula bar or editing the code in the right pane directly
- once the user commits the code change, Mesh `eval`s the code
- this produces the values and UI in the grid on the left.

Mesh's grid and status bar are built in React, and state is managed via Redux.

Mesh's `Sheet` object in `sheet.js`, in addition to wrapping the grid defined in `grid_component.js`, offers an interface allowing values to 'attach' themselves to the grid. This `attach` method:

- detects the type of the attached value, and 
- figures out how to write it to the sheet using logic in `display_functions.js`.

The various functions in `display_functions.js` define the CSS class for a cell, what the formula bar looks like when it's selected, the location of the corresponding code in the right pane, and the UI behaviour for the cell.

The UI behaviour for the cell is typically taken from `default_cell_logic.js` and consists of various actions such as selecting the cell, going into edit mode, committing or discarding an edit, or deleting the cell's contents. 

These methods, all of which are simply reducers which modify a state object, are called by the state reducers in `reducers.js` which are themselves triggered by either methods of the `Sheet` object or UI events defined in `events.js`.

Of these reducers, `commit_edit` is most important. Currently it does a simple replacement of the cell's text in the right pane with the contents of the formula bar, using a method defined in `code_transformers.js`. This file also defines an `AST` class which uses the Recast parser to analyse the code in the right-hand pane. This `AST` class is also used to figure out where a cell's code is located.

Finally:

- `local_code_io.js` provides an abstraction over the local file system (and a CSV reader via Baby Parse)
- `settings.js` helps define platform-specific constants
- `utils.js` is a grab bag of small helpers.

### What happens when you start Mesh

First, Electron's **main process** runs the file nominated as main in `package.json`.

That file, being `electron_setup.js`, creates a **renderer process** that, among other things:

- loads main.html
- sets up CSS for CodeMirror, Mesh's code editor.

`main.html` loads the program's non-CodeMirror styles (`style.css`) and the entry point for the Mesh app, `mesh.js`.

`mesh.js`:

- starts CodeMirror via `code_editor.js`
- creates a new sheet via `sheet.js` (more below)
- creates a React-based status bar via `status_bar.js`
- binds UI events to various HTML elements via calls to functions in `events.js`
- sets up how we track and change state, via `reducers.js`.

`mesh.js` also exports an application object, `Mesh`, which offers:

- bindings to the various HTML elements of the app and the Redux store
- a way to trigger calculation and re-render
- some convenience functions for users (such as `load_CSV`).