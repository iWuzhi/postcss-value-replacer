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

module.exports = (opts) => {
    // Fix for Node 4
    const params = opts || {};

    // Options
    const filterByValues = params.filterByValues;
    const preserveDefault = params.preserveDefault;

    const scope = params.scope || ":root";
    const variableSyntax = params.variableSyntax || "";

    // Cache RegExp
    const reCSSVariable = {
        default: /^var\(-{2}\w{1}[\w+-]*/,
        sass: /\$\w{1}[\w+-]*/,
        less: /@\w{1}[\w+-]*/,
    };

    function parser(css) {
        const root = css.root();
        const storeProps = {};
        const variablesList = {};
        let rootSel = {};

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
                        let valArr = [];
                        if (filterByValues[decl.value]) {
                            valArr = [decl.value];
                        } else {
                            valArr = decl.value
                                .split(/\s|,/)
                                .filter((val) => val !== "")
                                .map(
                                    (val) => val.replace(/^\s+(.+)\s+$/),
                                    "$1"
                                );
                        }

                        valArr.forEach((val) => {
                            if (filterByValues[val]) {
                                let varVal = `var(--${filterByValues[val]})`;
                                if (preserveDefault) {
                                    varVal = `var(--${filterByValues[val]}, ${val})`;
                                }

                                decl.value = decl.value.replace(val, varVal);
                                variablesList[val] = `--${filterByValues[val]}`;
                            }
                        });
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
    }

    return {
        postcssPlugin: "postcss-value-replacer",
        Once(root, { result }) {
            parser(root);
        },
    };
};
