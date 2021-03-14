"use strict";

const postcss = require("postcss");

function addCSSVariable(variableSyntax, currentScope, value, prop) {
    if (variableSyntax) {
        currentScope.prepend({ prop, value });
    } else {
        currentScope.append({ prop, value });
    }
}

function hasVariable(variableSyntax, reCSSVariable, value) {
    const reTest = reCSSVariable[variableSyntax] || reCSSVariable.default;
    return reTest.test(value);
}

module.exports = postcss.plugin("postcss-value-replacer", (opts) => {
    // Fix for Node 4
    const params = opts || {};

    // Options
    const filterByValues = params.filterByValues;

    const scope = params.scope || ":root";
    const variableSyntax = params.variableSyntax || "";

    // Cache RegExp
    const reCSSVariable = {
        default: /^var\(-{2}\w{1}[\w+-]*/,
        sass: /\$\w{1}[\w+-]*/,
        less: /@\w{1}[\w+-]*/,
    };

    return function parser(css) {
        const root = css.root();
        const storeProps = {};
        let rootSel = {};
        let checkValueFilter = true;

        css.walkRules((rule) => {
            if (rule.selector === scope) {
                rootSel = rule;
            } else {
                rule.walkDecls((decl) => {
                    if (
                        !hasVariable(variableSyntax, reCSSVariable, decl.value)
                    ) {
                        if (!storeProps[decl.prop]) {
                            storeProps[decl.prop] = [];
                        }
                        checkValueFilter =
                            !filterByValues ||
                            (filterByValues && filterByValues[decl.value]);
                        if (checkValueFilter) {
                            variablesList[decl.value] = `--${
                                filterByValues[decl.value]
                            }`;
                            decl.value = `var(--${filterByValues[decl.value]})`;
                        }
                    }
                });
            }
        });

        if (Object.keys(rootSel).length === 0) {
            if (variableSyntax) {
                rootSel = root;
            } else {
                rootSel = postcss.rule({ selector: scope });
                root.prepend(rootSel);
            }
        }

        const varialbleListKeys = Object.keys(variablesList);
        if (variableSyntax) {
            varialbleListKeys.reverse();
        }

        varialbleListKeys.forEach((value) => {
            addCSSVariable(
                variableSyntax,
                rootSel,
                value,
                variablesList[value]
            );
        });
    };
});
