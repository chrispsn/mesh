Contributions are welcome!

Please see the [issues page](https://github.com/chrispsn/mesh/projects) and the [contribution ideas](https://github.com/chrispsn/mesh/projects/2) pages.

# The Mesh vision

Mesh should empower people to make the most of their existing computers in their daily lives, and in so doing, accelerate the rate of human progress.

Mesh achieves this by combining the best aspects of spreadsheets and 'traditional' programming, and making them available to as many people as possible.

This means we should aim for (some of these are aspirational as of 2018-06-20):

- **Internet Explorer 11 compatibility.** So basically write Mesh in ES5 with some extras like `Set`s. (IE11 will be [supported until at least 2025](https://support.microsoft.com/en-us/lifecycle/search?alpha=Windows%2010)!)
- **No install required.** Many users may not have permission to install software, so anything that improves the lives of people running it in their browser is welcome. At the same time, we recognise that some capabilities are only possible via the Electron app (native UI, local IO).
- **No compilation required.** Novice users should be able to read and edit the source code without installing anything.
- **2000 lines of code.** Users should be able to scan the codebase to get comfortable that Mesh won't secretly send their data over the internet. Anything that helps us remove dependencies with minimal impact on features is welcome.
- **Mesh files have no dependencies.** Mesh files include around 50 lines of code to provide a spreadsheet-like calculation environment and a table data structure. These files should be standalone JavaScript files - they shouldn't require the Mesh app to run or edit.
- **Write Mesh in Mesh.** It's easier to see the high-level structure and should provide users with a lower barrier to entry to contribute.
- **Low-ish learning curve.** JavaScript has a chequered history and users don't need to be exposed to all of it. For example, by defining data in cells, users don't need to learn the difference between `var`, `let` and `const`. There may be other opportunities to "smooth over" the experience - for example, could Mesh provide a "UI for SQL", like a Pivot Table that manages chains of `map`, `filter`, `reduce` etc calls on a table? 
- **Use what JavaScript already gives you.** For example, Mesh uses JavaScript as its formula language instead of defining its own. JavaScript also provides standard value formatting functions (such as [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat)).
