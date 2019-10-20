document.addEventListener("meshAppReady", function() {
    window._defFunctions();
    window.onmessage = function(e) {
        console.log('MESSAGE RECEIVED BY', window.name, ':', e.data);
        window._defCells(_CELLS); window._extraValues(e.data.values);
        window._calcSheet(_CELLS); window.parent.postMessage(window._OUTPUT, '*')
    }
    
    window._defCells(_CELLS);
    window._calcSheet(_CELLS);
    console.log("POST MESSAGE RAF", window._OUTPUT);
    window.parent.postMessage(window._OUTPUT, '*');
});
