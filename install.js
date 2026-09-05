#!/usr/bin/env node
/**
 * beyondme installer.
 *
 * Written in Node rather than Python on purpose: SillyTavern itself runs on
 * Node, so anyone who can run SillyTavern can run this. No install required,
 * no dependencies — only Node's own fs/path.
 *
 * Copies the character card, presets and UI extension into an existing
 * SillyTavern install, then patches the handful of settings the setup needs.
 * It never reads or writes your API keys, your chats, or your persona.
 *
 *   node install.js "C:\\path\\to\\SillyTavern"
 *   node install.js            # looks for SillyTavern next to this folder
 */

const fs = require('fs');
const path = require('path');

const HERE = __dirname;

function isSillyTavern(dir) {
    return dir && fs.existsSync(path.join(dir, 'data', 'default-user'));
}

function findSillyTavern(explicit) {
    const parent = path.dirname(HERE);
    const candidates = [
        explicit,
        path.join(parent, 'SillyTavern'),
        path.join(parent, 'sillytavern'),
        path.join(parent, 'beyondme'),
    ].filter(Boolean);

    return candidates.find(isSillyTavern) || null;
}

function copyDir(src, dst) {
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true });
}

function main() {
    const root = findSillyTavern(process.argv[2]);

    if (!root) {
        console.error('Could not find SillyTavern.\n');
        console.error('Pass the path to it, for example:');
        console.error('  node install.js "C:\\SillyTavern"\n');
        console.error("If you haven't started SillyTavern yet, run it once and");
        console.error('close it — that creates the data folder this copies into.');
        process.exit(1);
    }

    const data = path.join(root, 'data', 'default-user');
    console.log(`Installing into: ${data}\n`);

    // ---- 1. character card ------------------------------------------------
    const charDst = path.join(data, 'characters');
    fs.mkdirSync(charDst, { recursive: true });
    for (const f of fs.readdirSync(path.join(HERE, 'characters'))) {
        fs.copyFileSync(path.join(HERE, 'characters', f), path.join(charDst, f));
        console.log(`  + characters/${f}`);
    }

    // ---- 2. presets: the tuned prompts and sampler settings ---------------
    const presetDst = path.join(data, 'OpenAI Settings');
    fs.mkdirSync(presetDst, { recursive: true });
    for (const f of fs.readdirSync(path.join(HERE, 'OpenAI Settings'))) {
        fs.copyFileSync(path.join(HERE, 'OpenAI Settings', f), path.join(presetDst, f));
        console.log(`  + OpenAI Settings/${f}`);
    }

    // ---- 3. the UI extension ----------------------------------------------
    const extDst = path.join(data, 'extensions');
    fs.mkdirSync(extDst, { recursive: true });
    for (const ext of fs.readdirSync(path.join(HERE, 'extensions'))) {
        copyDir(path.join(HERE, 'extensions', ext), path.join(extDst, ext));
        console.log(`  + extensions/${ext}`);
    }

    // ---- 4. the launcher, into the SillyTavern root --------------------
    // Leaner than Start.bat: skips the npm install pass that otherwise runs
    // on every single launch.
    const launcherDir = path.join(HERE, 'launcher');
    if (fs.existsSync(launcherDir)) {
        for (const f of fs.readdirSync(launcherDir)) {
            const dst = path.join(root, f);
            fs.copyFileSync(path.join(launcherDir, f), dst);
            if (f.endsWith('.sh')) {
                try { fs.chmodSync(dst, 0o755); } catch {}
            }
            console.log(`  + ${f}  (in the SillyTavern folder)`);
        }
    }

    // ---- 5. patch settings.json -------------------------------------------
    // Only the keys this setup depends on. Keys live in secrets.json, which is
    // never touched.
    const sp = path.join(data, 'settings.json');
    if (!fs.existsSync(sp)) {
        console.log('\n! No settings.json yet.');
        console.log('  Start SillyTavern once, close it, then run this again.');
        return;
    }

    const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    const vals = JSON.parse(fs.readFileSync(path.join(HERE, 'settings-values.json'), 'utf8'));
    const summary = fs.readFileSync(path.join(HERE, 'summarize-prompt.txt'), 'utf8');

    s.power_user = s.power_user || {};
    s.oai_settings = s.oai_settings || {};
    s.extension_settings = s.extension_settings || {};
    s.extension_settings.memory = s.extension_settings.memory || {};

    s.oai_settings.temp_openai = vals.temp_openai;
    for (const k of ['fast_ui_mode', 'reduced_motion', 'blur_strength', 'shadow_width',
                     'timestamps_enabled', 'timestamp_model_icon', 'chat_display',
                     'sort_field', 'sort_order']) {
        s.power_user[k] = vals[k];
    }
    s.extension_settings.memory.prompt = summary;
    s.extension_settings.memory.promptWords = vals.summary_promptWords;

    fs.writeFileSync(sp, JSON.stringify(s, null, 4), 'utf8');
    console.log('  + settings.json patched (prompts, temperature, UI, summariser)');

    console.log('\nDone. Next:');
    console.log('  1. Start it with beyondme.bat (Windows) or ./beyondme.sh');
    console.log('  2. API Connections -> add YOUR OWN Google AI Studio key');
    console.log("  3. Choose the 'Default' preset, then open College Roommates");
}

main();
