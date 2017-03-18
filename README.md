# Mesh

> An IDE that uses a grid interface to visualise data and edit code.

## How to start developing

```
$ npm install
$ npm start
```

### How to build a standalone app

TODO get this working

```
$ npm run build
```

Builds the app for macOS, Linux, and Windows, using [electron-packager](https://github.com/electron-userland/electron-packager).

## Complaints about the status quo

TODO make this a table

At their core, most spreadsheets are just values in cells, and operations on them.

There's no knowledge about the structure of that data,
nor any operations going on behind the scenes storing information about it.

For example, Excel's VLOOKUP is (if you're getting an exact match) a naive O(n) search.

A hashmap access in most programming languages would be way faster.

## Why Mesh is better

Mesh is a spreadsheet that knows about data structures.

Think of it as an IDE that looks like a spreadsheet.

You perform actions (such as editing code or updating a database) via operations on the spreadsheet.

You can also show objects on the spreadsheet.

Most importantly: you *cannot* refer to objects via their coordanites.

The code you write should (in principle) work without Mesh,
so you can run it in an automated process.

# Example

You pull data from, say, a CSV.

You say how you want the data to be displayed in the spreadsheet.

Let's say the data is a record set.

You want the sum of all records that have colour = blue.

You start writing your formula and, instead of *typing* a reference, you click on the part of the data structure you want to reference. 

It auto-fills with one possible answer, and presents any alternatives as an auto-complete menu.

You can display your formula's return value in the spreadsheet as well.

You could also have written your formula in the spreadsheet, and it would write the corresponding code to a file.

# Mechanic ideas

So one way we could do this would be:

- data structures live in the code
- associate 'representations' with each data structure (or function or whatever)
- representations know what cells they take up in the grid so when you click, it knows what representations are being hit (and can do autocomplete appropriately)
- representations also know what to do if there's a collision with another representation
