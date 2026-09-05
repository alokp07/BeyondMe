#!/usr/bin/env node
/**
 * beyondme — phone setup.
 *
 * One double-click instead of a command to memorise. Turns on Tailscale's
 * HTTPS proxy for SillyTavern and prints the address to open on your phone.
 *
 * Run it once. The result survives reboots.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WIN_TAILSCALE = 'C:\Program Files\Tailscale\tailscale.exe';

function tailscaleBin() {
    // Windows installs it outside PATH more often than not
    if (process.platform === 'win32' && fs.existsSync(WIN_TAILSCALE)) return WIN_TAILSCALE;
    return 'tailscale';
}

function run(bin, args) {
    return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function findSillyTavern() {
    const parent = path.dirname(__dirname);
    for (const c of [path.join(parent, 'SillyTavern'), path.join(parent, 'sillytavern'),
                     path.join(parent, 'beyondme'), __dirname]) {
        if (fs.existsSync(path.join(c, 'config.yaml'))) return c;
    }
    return null;
}

console.log('\n  beyondme — phone setup');
console.log('  ----------------------\n');

const bin = tailscaleBin();

// 1. is Tailscale even here?
try {
    run(bin, ['version']);
} catch {
    console.log('  Tailscale is not installed (or not signed in).\n');
    console.log('  1. Get it from https://tailscale.com/download');
    console.log('  2. Sign in on this computer AND on your phone, same account');
    console.log('  3. Run this again\n');
    process.exit(1);
}

// 2. turn on the HTTPS proxy
console.log('  Turning on HTTPS for SillyTavern...\n');
try {
    run(bin, ['serve', '--bg', '8000']);
} catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString();
    if (/HTTPS|cert|MagicDNS/i.test(msg)) {
        console.log('  Tailscale needs two free features switched on first:\n');
        console.log('    https://login.tailscale.com/admin/dns');
        console.log('      - enable MagicDNS');
        console.log('      - enable HTTPS Certificates\n');
        console.log('  Then run this again.\n');
    } else {
        console.log('  Could not start it:\n');
        console.log('   ', msg.trim().split('\n')[0], '\n');
    }
    process.exit(1);
}

// 3. read back the address
let address = null;
try {
    const status = run(bin, ['serve', 'status']);
    const m = status.match(/https:\/\/[^\s]+/);
    if (m) address = m[0].replace(/\/$/, '');
} catch { /* fall through */ }

if (!address) {
    console.log('  Started, but could not read the address back.');
    console.log('  Run:  tailscale serve status\n');
    process.exit(0);
}

console.log('  Done. Open this on your phone:\n');
console.log('    ' + address + '\n');
console.log('  Then: browser menu -> Install / Add to Home Screen');
console.log('  That gives you a fullscreen app icon.\n');
console.log('  This address is permanent — you only run this once.\n');

// 4. warn if SillyTavern will reject the connection
const root = findSillyTavern();
if (root) {
    const cfg = fs.readFileSync(path.join(root, 'config.yaml'), 'utf8');
    const whitelistOn = /^whitelistMode:\s*true/m.test(cfg);
    const authOff = /^basicAuthMode:\s*false/m.test(cfg);

    if (whitelistOn || authOff) {
        console.log('  ---------------------------------------------------------');
        console.log('  Before this works, edit config.yaml in your SillyTavern');
        console.log('  folder:\n');
        if (whitelistOn) {
            console.log('    whitelistMode: false      <- currently true, blocks the phone');
        }
        if (authOff) {
            console.log('    basicAuthMode: true       <- currently false, NO PASSWORD');
            console.log('    basicAuthUser:');
            console.log('      username: pick-your-own');
            console.log('      password: pick-a-real-one');
        }
        console.log('\n  That password is the only thing protecting your chats');
        console.log('  from anyone else on your network. Set it yourself.');
        console.log('  ---------------------------------------------------------\n');
    }
}
