Contributions are welcome!

Please see the [issues page](https://github.com/chrispsn/mesh/projects) and the [contribution ideas](https://github.com/chrispsn/mesh/projects/2) pages for a vision of where this project is going.

Please keep in mind that Mesh has design constraints (some are aspirational as of 2018-06-20).

Mesh should provide:

- spreadsheet users, who may not want to get their around the fiddly bits of JavaScript, with a more powerful programming experience
- programmers with a more visual way to program that provides immediate feedback and allows rapid, iterative development.

This means we should aim for:

- **Internet Explorer 11 compatibility.** So basically write Mesh in ES5 with some extras like `Set`s. (IE11 will be [supported until at least 2025](https://support.microsoft.com/en-us/lifecycle/search?alpha=Windows%2010)!)
- **No install required.** Many users may not have permission to install software, so anything that improves the lives of people running it in their browser is welcome. At the same time, we recognise that some capabilities are only possible via the Electron app (native UI, local IO).
- **No compilation required.** Novice users should be able to read and edit the source code without installing anything.
- **2000 lines of code.** The codebase should be small enough that users can scan it to get comfortable that Mesh won't secretly send their data over the internet. Anything that helps us remove dependencies while not degrading features is welcome.
- **No boilerplate dependencies.** Mesh files include around 50 lines of code to provide a spreadsheet-like calculation environment. These files should be standalone JavaScript files - they shouldn't require the Mesh app to run or edit.
- **Write Mesh in Mesh.** It's easier to see the structure and should provide users with a lower barrier to entry to contribute.
