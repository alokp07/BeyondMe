/**
 * beyondme UI
 *
 * Phone-first chat interface built on top of SillyTavern's DOM. Pure DOM work,
 * no SillyTavern imports, so a `git pull` or an internal API change can't
 * break it.
 *
 *   1. ✱ button that wraps action text in *asterisks*
 *   2. Avatar moved INTO the message header, so the bubble gets full width
 *      instead of losing ~50px to a side column
 *   3. Long italic runs tagged as narration -> their own line
 *   4. Top bar hidden by default, revealed on scroll-up
 *   5. Character panel opens to the list, not the card editor
 *   6. Canned welcome greeting hidden on the home screen
 */

const BTN_ID = 'beyondme-asterisk-btn';
const TEXTAREA_ID = 'send_textarea';
const PHONE_MAX_WIDTH = 1000;

const isPhone = () => window.innerWidth <= PHONE_MAX_WIDTH;

/* ---------------------------------------------------------- ✱ wrap button */

function wrapAsterisks() {
    const ta = document.getElementById(TEXTAREA_ID);
    if (!ta) return;

    const { selectionStart: start, selectionEnd: end, value } = ta;

    if (start !== end) {
        ta.value = value.slice(0, start) + '*' + value.slice(start, end) + '*' + value.slice(end);
        ta.selectionStart = start + 1;
        ta.selectionEnd = end + 1;
    } else {
        ta.value = value.slice(0, start) + '**' + value.slice(start);
        ta.selectionStart = ta.selectionEnd = start + 1;
    }

    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function addButton() {
    if (document.getElementById(BTN_ID)) return;
    const left = document.getElementById('leftSendForm');
    if (!left) return;

    const btn = document.createElement('div');
    btn.id = BTN_ID;
    btn.className = 'fa-solid fa-asterisk interactable';
    btn.title = 'Wrap in *asterisks* (action text)';
    btn.tabIndex = 0;

    // Keep focus in the textarea, or the selection is gone before `click`.
    btn.addEventListener('pointerdown', (e) => e.preventDefault());
    btn.addEventListener('click', wrapAsterisks);
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            wrapAsterisks();
        }
    });

    left.appendChild(btn);
}

/* ------------------------------------------ avatar into the message header */

// SillyTavern lays a message out as [avatar column][bubble]. On a phone that
// column costs ~50px of every line for a 38px picture. Moving the avatar into
// the name row gives the text the full width and reads like a chat app.
function mergeAvatarIntoHeader() {
    for (const mes of document.querySelectorAll('#chat .mes:not([data-bm-avatar])')) {
        const avatar = mes.querySelector('.mesAvatarWrapper .avatar');
        const nameRow = mes.querySelector('.ch_name > .flex-container');
        if (!avatar || !nameRow) continue;

        mes.dataset.bmAvatar = '1';
        avatar.classList.add('beyondme-inline-avatar');
        nameRow.insertBefore(avatar, nameRow.firstChild);
    }
}

/* ------------------------------------------- narration onto its own line */

// A model writes *she crosses her arms* (narration) and *not* (emphasis) with
// the same asterisks, so CSS alone can't separate them. Length is a good
// enough signal: narration is a clause, emphasis is a word.
const NARRATION_MIN_CHARS = 25;

function markNarration() {
    const italics = document.querySelectorAll(
        '.mes_text em:not([data-bm]), .mes_text i:not([data-bm])',
    );
    for (const el of italics) {
        el.dataset.bm = '1';
        if (el.textContent.trim().length >= NARRATION_MIN_CHARS) {
            el.classList.add('beyondme-narration');
        }
    }
}

/* -------------------------------------------------- open the character panel */

// The icon row is parked off-screen (not display:none) precisely so this can
// click it without touching any styles. Toggling display here is what caused
// the flicker: two mutations per press, each waking the observer.
function openCharacterPanel() {
    const icon = document.getElementById('rightNavDrawerIcon');
    if (icon) icon.click();
}

// Landing on the home screen should show your characters, not an empty page.
//
// The earlier version flickered because it could fire repeatedly: each
// synthesised click mutated the DOM, which woke the observer, which clicked
// again. The latch below flips BEFORE the click and never resets, so this runs
// at most once per page load however often the observer fires.
let openedCharactersOnce = false;

function openCharactersOnFirstLoad() {
    if (openedCharactersOnce || !isPhone()) return;

    const chat = document.getElementById('chat');
    if (!chat || !chat.querySelector('.welcomePanel')) return;   // not home yet

    const panel = document.getElementById('right-nav-panel');
    if (panel && panel.classList.contains('openDrawer')) {
        openedCharactersOnce = true;
        return;
    }

    openedCharactersOnce = true;   // latch FIRST, before any mutation
    openCharacterPanel();
}

// Tapping a character selects it AND opens SillyTavern's card editor over the
// chat — which, with the editor's fields hidden on phones, is a blank panel.
// Close the drawer instead so you land in the conversation.
//
// This is a real click listener, not observer-driven: it fires once per actual
// tap, so it can't feed back into the MutationObserver the way the old
// auto-clicking did.
function initCloseOnCharacterPick() {
    if (document.body.dataset.bmPickHook) return;
    document.body.dataset.bmPickHook = '1';

    document.addEventListener('click', (e) => {
        if (!isPhone()) return;
        const card = e.target.closest('#rm_print_characters_block .character_select');
        if (!card) return;

        // let SillyTavern load the chat first, then get the panel out of the way
        setTimeout(() => {
            const panel = document.getElementById('right-nav-panel');
            if (panel && panel.classList.contains('openDrawer')) openCharacterPanel();
        }, 400);
    }, true);
}

/* ---------------------------------------------------------- chat header */

// A real chat app has a header: back arrow + who you're talking to. Hiding
// SillyTavern's icon row without one left no way out of a chat, so this
// replaces it rather than just removing it.
function buildChatHeader() {
    if (document.getElementById('bm-chat-header')) return;
    const sheld = document.getElementById('sheld');
    const chat = document.getElementById('chat');
    if (!sheld || !chat) return;

    const header = document.createElement('div');
    header.id = 'bm-chat-header';

    const back = document.createElement('div');
    back.id = 'bm-back';
    back.className = 'fa-solid fa-chevron-left';
    back.title = 'Characters';
    back.addEventListener('click', () => {
        openCharacterPanel();
        // The drawer reopens on whichever sub-panel was last shown. After
        // you've picked someone that's the card EDITOR — and its fields are
        // hidden on phones, so you'd get a near-blank screen. Switch it back
        // to the list. One-shot per tap, so it can't loop.
        setTimeout(() => {
            const editor = document.getElementById('rm_ch_create_block');
            if (editor && editor.offsetParent !== null) {
                document.getElementById('rm_button_back')?.click();
            }
        }, 250);
    });

    const title = document.createElement('div');
    title.id = 'bm-title';

    header.append(back, title);
    sheld.insertBefore(header, chat);

    initHeaderAutoHide();
}

// Move SillyTavern's connection/model drawer button INTO this header, so one
// bar carries everything: back, who you're talking to, and the model switcher.
//
// Phones only, and reversible: this header is display:none on desktop, so
// leaving the button inside it would make the connection panel unreachable on
// the laptop. We remember exactly where it came from and put it back.
let connectionButtonHome = null;

function adoptConnectionButton() {
    const conn = document.getElementById('sys-settings-button');
    if (!conn) return;

    if (!connectionButtonHome) {
        connectionButtonHome = { parent: conn.parentElement, next: conn.nextElementSibling };
    }

    const header = document.getElementById('bm-chat-header');

    if (isPhone()) {
        if (header && !header.contains(conn)) {
            conn.classList.add('bm-adopted');
            header.appendChild(conn);
        }
        return;
    }

    // wide screen — restore it to its original slot in SillyTavern's row
    const home = connectionButtonHome;
    if (home.parent && !home.parent.contains(conn)) {
        conn.classList.remove('bm-adopted');
        home.parent.insertBefore(conn, home.next);
    }
}

// Hidden by default so it never crops the conversation; slides in when you
// scroll up — the usual phone gesture — and while you're at the top.
function initHeaderAutoHide() {
    const chat = document.getElementById('chat');
    if (!chat || chat.dataset.bmHdrScroll) return;
    chat.dataset.bmHdrScroll = '1';

    let lastY = chat.scrollTop;
    const show = () => document.body.classList.add('bm-header-show');
    const hide = () => document.body.classList.remove('bm-header-show');

    show();   // visible on arrival, then gets out of the way as you read

    chat.addEventListener('scroll', () => {
        const y = chat.scrollTop;
        if (y < 30 || y < lastY - 5) show();
        else if (y > lastY + 5) hide();
        lastY = y;
    }, { passive: true });
}

function updateChatHeader() {
    const title = document.getElementById('bm-title');
    const chat = document.getElementById('chat');
    if (!title || !chat) return;

    if (chat.querySelector('.welcomePanel')) {
        title.textContent = 'beyondme';
        document.body.classList.add('bm-home');
        return;
    }
    document.body.classList.remove('bm-home');

    // Name of whoever is talking — the last non-user message.
    const names = chat.querySelectorAll('.mes:not([is_user="true"]) .name_text');
    if (names.length) {
        const name = names[names.length - 1].textContent.trim();
        if (name && title.textContent !== name) title.textContent = name;
    }
}

// NOTE: a scroll-to-reveal top bar used to live here. It overlapped the
// beyondme header, added motion for no benefit, and existed only to reach the
// character list — which the header's back arrow now does directly. The icon
// row is simply parked off-screen on phones.

/* --------------------------------------- home page: drop the canned greeting */

// The home page prints a canned "Assistant / If you're connected to an API…"
// greeting. Those are real chat messages, not panels, so CSS can't tell them
// from your roleplay — but they only appear beside .welcomePanel, so key off
// that and keep the recent-chats panel itself.
function hideWelcomeGreeting() {
    const chat = document.getElementById('chat');
    if (!chat) return;

    const onWelcomeScreen = !!chat.querySelector('.welcomePanel');

    for (const mes of chat.querySelectorAll('.mes')) {
        const isRecentChatsPanel = !!mes.querySelector('.welcomePanel');
        mes.classList.toggle('beyondme-hide', onWelcomeScreen && !isRecentChatsPanel);
    }
}

/* ------------------------------------------------- chat backdrop = the character */

// Default the chat backdrop to the character's own art. If you pick a scene in
// SillyTavern's background panel, that wins — we only step in while the app
// background is the transparent placeholder, so your choice is never fought.
function applyCharacterBackdrop() {
    const chat = document.getElementById('chat');
    if (!chat) return;

    const clear = () => {
        document.body.classList.remove('bm-has-char-bg');
        delete document.body.dataset.bmBg;
    };

    // On the home screen the only "character" message is the canned Assistant
    // greeting — using its avatar turned the ST logo into a giant watermark.
    if (chat.querySelector('.welcomePanel')) return clear();

    const bg = document.getElementById('bg1');
    const stBg = bg ? getComputedStyle(bg).backgroundImage : '';
    const usingPlaceholder = !stBg || stBg === 'none' || stBg.includes('__transparent');

    // a real scene is set — get out of the way, your choice wins
    if (!usingPlaceholder) return clear();

    const img = chat.querySelector('.mes:not([is_user="true"]) .avatar img');
    if (!img || !img.src) return clear();

    // Avatars are small thumbnails; use the full card art so it isn't blurry.
    let full = img.src;
    const m = img.src.match(/[?&]file=([^&]+)/);
    if (m) full = '/characters/' + m[1];

    if (document.body.dataset.bmBg === full) return;   // already applied
    document.body.dataset.bmBg = full;
    document.body.style.setProperty('--bm-char-bg', `url("${full}")`);
    document.body.classList.add('bm-has-char-bg');
}

/* ------------------------------------------------- phone back button */

// This is a single page with no history, so Android's Back button closed the
// whole app. Park one history entry so Back can close the character panel
// instead. If nothing is open we deliberately do NOT re-arm — Back should
// still be able to leave, rather than trapping you in the app.
// Closes whichever drawer is open — characters, connection/model, anything.
// Clicks SillyTavern's own toggle so its state stays consistent.
function closeAnyOpenDrawer() {
    const open = document.querySelector('.drawer-content.openDrawer');
    if (!open) return false;

    const holder = open.closest('.drawer');
    const toggle = holder?.querySelector('.drawer-toggle, .drawer-icon');
    if (!toggle) return false;

    toggle.click();
    return true;
}

function initPhoneBackButton() {
    if (window.__bmBackHooked) return;
    window.__bmBackHooked = true;

    try { history.pushState({ bm: true }, ''); } catch { return; }

    window.addEventListener('popstate', () => {
        // Any open drawer swallows the Back press. Previously only the
        // character panel did, so opening the connection panel left you
        // trapped — Back killed the whole app instead of closing it.
        if (closeAnyOpenDrawer()) {
            try { history.pushState({ bm: true }, ''); } catch {}   // consumed
        }
    });
}

// Re-arm the Back button each time a drawer opens, so there's always an entry
// for it to consume rather than exiting the app.
let anyDrawerWasOpen = false;

function armBackForDrawers() {
    const open = !!document.querySelector('.drawer-content.openDrawer');
    if (open && !anyDrawerWasOpen) {
        try { history.pushState({ bm: true }, ''); } catch {}
    }
    anyDrawerWasOpen = open;
}

// A panel that fills the screen needs a visible way out — relying on the
// phone's Back button isn't good enough. Shown only while a drawer is open.
function initDrawerCloseButton() {
    let btn = document.getElementById('bm-drawer-close');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'bm-drawer-close';
        btn.className = 'fa-solid fa-xmark';
        btn.title = 'Close';
        btn.addEventListener('click', () => closeAnyOpenDrawer());
        document.body.appendChild(btn);
    }
    const open = !!document.querySelector('.drawer-content.openDrawer');
    // the character grid has its own exit (tap a character), so only show the
    // ✕ for panels that would otherwise be a dead end
    const isCharacterPanel = document.getElementById('right-nav-panel')?.classList.contains('openDrawer');
    btn.classList.toggle('bm-visible', isPhone() && open && !isCharacterPanel);
}

/* --------------------------------------------- character screen: the wordmark */

// The character panel covers the chat header, so the app name disappears on
// the screen you land on. Put it back at the top of the grid.
// The pin star ships inside the name container, which is itself absolutely
// positioned at the bottom of the card — so "top: 6px" put it at the bottom.
// Re-parent it to the card so it can sit in the top-right corner.
function liftPinStars() {
    for (const card of document.querySelectorAll('#rm_print_characters_block .character_select:not([data-bm-pin])')) {
        const star = card.querySelector('.ch_fav_icon');
        if (!star) continue;
        card.dataset.bmPin = '1';
        card.appendChild(star);

        // The star sits inside the card, so a tap on it also counts as a tap
        // on the card — which opened the chat instead of pinning. Swallow the
        // event so pinning is just pinning.
        star.addEventListener('click', (e) => e.stopPropagation());
        star.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
}

// While the character panel is open the chat header underneath still shows,
// so you'd see the chat's title stacked above the wordmark. Flag it so CSS can
// hide the header for the duration.
function syncPanelState() {
    const panel = document.getElementById('right-nav-panel');
    const open = !!(panel && panel.classList.contains('openDrawer'));
    document.body.classList.toggle('bm-panel-open', open);
}

function addCharactersTitle() {
    if (document.getElementById('bm-chars-title')) return;
    const block = document.getElementById('rm_characters_block');
    if (!block) return;

    const title = document.createElement('div');
    title.id = 'bm-chars-title';
    title.textContent = 'beyondme';
    block.insertBefore(title, block.firstChild);
}

/* ------------------------------------------------------ shorter placeholder */

// SillyTavern's default ("Type a message, or /? for help") is far too long for
// a phone field — it clips mid-word and the caret sitting at the cut looked
// like a stray vertical line.
function shortenPlaceholder() {
    const ta = document.getElementById(TEXTAREA_ID);
    if (ta && ta.placeholder !== 'Message' && !ta.placeholder.includes('Not connected')) {
        ta.placeholder = 'Message';
    }
}

/* ------------------------------------------------------------------ wiring */

// Everything here must be idempotent and must not synthesise clicks, or the
// observer below turns it into a loop.
function apply() {
    buildChatHeader();
    adoptConnectionButton();   // in apply(), so it follows window resizes
    updateChatHeader();
    addButton();
    mergeAvatarIntoHeader();
    markNarration();
    hideWelcomeGreeting();
    applyCharacterBackdrop();
    openCharactersOnFirstLoad();
    initCloseOnCharacterPick();
    addCharactersTitle();
    liftPinStars();
    shortenPlaceholder();
    syncPanelState();
    initPhoneBackButton();
    armBackForDrawers();
    initDrawerCloseButton();
}

apply();

// Panels and messages are re-rendered constantly, so re-apply on DOM changes.
// Every step above is guarded by a data attribute, so this settles after one
// pass instead of looping on its own mutations.
let queued = false;
new MutationObserver(() => {
    if (queued) return;
    queued = true;
    setTimeout(() => {
        queued = false;
        apply();
    }, 200);
}).observe(document.body, {
    childList: true,
    subtree: true,
    // Drawers open/close by toggling a CLASS, not by adding nodes. Without
    // watching attributes, none of the drawer-state logic (close button,
    // panel sync, Back arming) ever re-ran. Filtered to `class` so this stays
    // cheap, and every handler is idempotent — a toggle to the value it
    // already has doesn't touch the attribute, so this can't loop.
    attributes: true,
    attributeFilter: ['class'],
});
