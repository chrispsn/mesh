Contributions are welcome!

For ideas, please see the [issues page](https://github.com/chrispsn/mesh/issues) and the [contributions project](https://github.com/chrispsn/mesh/projects/2).

# The Mesh vision

Mesh should help people make the most of their existing computers in their daily lives.

Mesh achieves this by combining the best aspects of spreadsheets and 'traditional' programming, and making them available to as many people as possible.

This means we should aim for (some of these are aspirational as of 2018-06-20):

- **Internet Explorer 11 compatibility.** So basically write Mesh in ES5 with some extras like `Set`s. (IE11 will be [supported until at least 2025](https://support.microsoft.com/en-us/lifecycle/search?alpha=Windows%2010)!)
- **No install required.** Many users may not have permission to install software, so anything that improves the lives of people running it in their browser is welcome. At the same time, we recognise that some capabilities are only possible via the Electron app (native UI, local IO).
- **No compilation required.** Novice users should be able to read and edit the source code without installing anything.
- **2000 lines of code.** Users should be able to scan the codebase to get comfortable that Mesh won't secretly send their data over the internet. Anything that helps us remove dependencies with minimal impact on features is welcome.
- **Mesh files have no dependencies.** Mesh files include around 50 lines of code to provide a spreadsheet-like calculation environment and a table data structure. These files should be standalone JavaScript files - they shouldn't require the Mesh app to run or edit.
- **Where it makes sense, write Mesh in Mesh.** It's easier to see the high-level structure and should provide users with a lower barrier to entry to contribute.
- **Low-ish learning curve.** JavaScript has a chequered history and users don't need to be exposed to all of it. For example, by defining data in cells, users don't need to learn the difference between `var`, `let` and `const`. There may be other opportunities to "smooth over" the experience - for example, could Mesh provide a "UI for SQL", like a Pivot Table that manages chains of `map`, `filter`, `reduce` etc calls on arrays? 
- **Use what JavaScript already gives you.** For example, Mesh uses JavaScript as its formula language instead of defining its own. JavaScript also provides standard value formatting functions (such as [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)).

# Checklist before submitting a pull request

- Do the tests pass?
- Should I write some tests?
- Does this work in a wide variety of browsers (IE11, Chrome, Firefox, Edge)? 

# Tour of the codebase

Most files in `src` are for turning the user's UI actions into changes in the Mesh file's JavaScript code.

For example, say Mesh is in **READY** mode and the user types `1.23%` into a value cell:

- Mesh will recognise the user started typing and will invoke an event defined in `mesh` or `events`. The event gets routed through `reducers`, which manages the state of the Mesh app. In this case, Mesh will go into **EDIT** mode, and the user's data entry will appear in the formula bar.
- When the user presses `Enter`, Mesh will look at the currently selected cell's `cell_AST_change_bindings`. In this case, the event is a `COMMIT_FORMULA_BAR_EDIT`, so Mesh will transform the formula bar contents into its JavaScript equivalent (here, `0.0123`) via rules defined in `data_entry`, and edit the Mesh file to contain that value via logic defined in `code_transformers`.
- Mesh will then enter **CALCULATING** mode and will run the file in a Web Worker whose boilerplate was originally defined in `settings`. The Web Worker sends its results back to Mesh as an object that maps names to cells. Each cell contains a raw JS value, its formatted string equivalent, a grid location, and some other minor settings.
-  Mesh then builds a new grid via `generate_cells`. It figures out how to represent each cell on the grid based on the type of the cell's JavaScript value and its AST node equivalent, using logic in `display_fn_triage` and `display`. The `display` file also gives each grid square some event information that is used by `cell_AST_change_bindings` in the next calculation cycle.
- Finally, Mesh renders the updated state to HTML via the `react_*` family of files, and returns to **READY** mode.

# Miscellaneous details

In Electron, line endings should check out and save as per your system's default (CRLF on Windows, LF on OSX/Unix). See more discussion at:

- <https://stackoverflow.com/a/4425433/996380>
- <https://git-scm.com/docs/gitattributes>
- <http://adaptivepatchwork.com/2012/03/01/mind-the-end-of-your-line/>
