/**
 * beyondme branding
 *
 * Rebrands the SillyTavern shell without touching tracked source files, so a
 * `git pull` update never wipes it. Deliberately uses no SillyTavern imports —
 * pure DOM work, so it does not break when internal APIs move between versions.
 */

const APP_NAME = 'beyondme';
const OLD_NAME = /SillyTavern/g;

/** SillyTavern never sets document.title itself, but themes and extensions might. */
function applyTitle() {
    if (document.title !== APP_NAME) {
        document.title = APP_NAME;
    }
}

/** Swap the welcome-panel logo image for a text wordmark. */
function applyWordmark() {
    for (const img of document.querySelectorAll('img.welcomeHeaderLogo')) {
        // Deliberately not carrying .welcomeHeaderLogo: that rule pins a 30x30
        // box for the image it replaces, which would crop the wordmark text.
        const mark = document.createElement('div');
        mark.className = 'beyondme-wordmark';
        mark.textContent = APP_NAME;
        img.replaceWith(mark);
    }
}

/**
 * Rename the product in visible copy. Skipped inside links and the help panel,
 * where "SillyTavern" refers to the upstream project itself and renaming it
 * would make the documentation wrong.
 */
const SKIP = 'a, code, pre, #help_popup, .help_popup, script, style, textarea';

function renameText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.includes('SillyTavern')) {
                return NodeFilter.FILTER_REJECT;
            }
            if (node.parentElement?.closest(SKIP)) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    for (const node of hits) {
        node.nodeValue = node.nodeValue.replace(OLD_NAME, APP_NAME);
    }
}

/**
 * The version line reads "<product> 1.18.0 'release' (sha)". Once the product is
 * renamed it sits right beside the wordmark and repeats it, so drop the prefix
 * and leave just the version.
 */
function trimVersionLine() {
    for (const el of document.querySelectorAll('.welcomeHeaderVersionDisplay')) {
        const t = el.textContent.trimStart();
        if (t.startsWith(APP_NAME + ' ')) {
            el.textContent = t.slice(APP_NAME.length + 1);
        }
    }
}

function apply() {
    applyTitle();
    applyWordmark();
    renameText(document.body);
    trimVersionLine();
}

apply();

// Panels are re-rendered on navigation, so re-apply when the DOM changes.
// Debounced, and idempotent (the replacement text no longer matches), so this
// settles after one pass rather than looping on its own mutations.
let queued = false;
new MutationObserver(() => {
    if (queued) return;
    queued = true;
    setTimeout(() => {
        queued = false;
        apply();
    }, 100);
}).observe(document.body, { childList: true, subtree: true, characterData: true });
