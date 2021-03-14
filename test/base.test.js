const run = require("./_run");

it("Basic usage", () => {
    const input = `.foo {
        color: #000;
        width: 10px;
        display: block;
    }`;
    const output = `:root {
        --primary-color: #000;
        --btn-width: 10px;
        --display-block: block;\n}\n.foo {
        color: var(--primary-color);
        width: var(--btn-width);
        display: var(--display-block);
    }`;
    return run(input, output, {
        filterByValues: {
            "#000": "primary-color",
            "10px": "btn-width",
            block: "display-block",
        },
    });
});

it("repeated values", () => {
    const input = `.foo {
        color: blue;
    }
    .bar {
        color: blue;
    }`;
    const output = `:root {
        --color-1: blue;\n}
    .foo {
        color: var(--color-1);
    }
    .bar {
        color: var(--color-1);
    }`;
    return run(input, output, {
        filterByValues: {
            blue: "color-1",
        },
    });
});

it("exist root element", () => {
    const input = `:root {
        --base-font-size: 16px;
    }
    .foo {
        color: #000;
        font-size: var(--base-font-size);
    }`;
    const output = `:root {
        --base-font-size: 16px;
        --color-1: #000;
    }
    .foo {
        color: var(--color-1);
        font-size: var(--base-font-size);
    }`;
    return run(input, output, {
        filterByValues: {
            "16px": "base-font-size",
            "#000": "color-1",
        },
    });
});

it("several colors in one property", () => {
    const input = `.foo {
        box-shadow: inset 0 2px 0px #dcffa6, 0 2px 5px #000;
    }`;
    const output = `:root {
        --box-shadow-1: #dcffa6;
        --box-shadow-2: #000;\n}\n.foo {
        box-shadow: inset 0 2px 0px var(--box-shadow-1), 0 2px 5px var(--box-shadow-2);
    }`;
    return run(input, output, {
        filterByValues: {
            "#dcffa6": "box-shadow-1",
            "#000": "box-shadow-2",
        },
    });
});

it("default value in css variable", () => {
    const input = `:root {
        --base-color: #fff;
    }
    .foo {
        color: var(--base-color, #000);
        border: 1px solid #eee;
    }`;
    const output = `:root {
        --base-color: #fff;
        --border-1: #eee;
    }
    .foo {
        color: var(--base-color, #000);
        border: 1px solid var(--border-1, #eee);
    }`;
    return run(input, output, {
        filterByValues: {
            "#fff": "base-color",
            "#eee": "border-1",
        },
        preserveDefault: true,
    });
});
