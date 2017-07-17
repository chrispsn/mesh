const React = require('react');

function FormulaBar(props) {
    return formula_bar = React.createElement('textarea', {
        id: 'formula-bar', value: props.formula_bar_value,
    });
}

module.exports = FormulaBar
