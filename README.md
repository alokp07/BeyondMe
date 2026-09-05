# beyondme

A tuned SillyTavern setup for character roleplay — prompts, a phone-first UI, and
a memory configuration that actually remembers.

This repo is **configuration only**. It contains no API keys and no chat history.

---

## What's in here

| | |
|---|---|
| `characters/` | The College Roommates card (four roommates, full definitions + art) |
| `OpenAI Settings/` | The tuned presets — main prompt, post-history rules, sampler settings |
| `extensions/beyondme-asterisk/` | The phone UI: chat bubbles, character grid, ✱ button, auto-hiding header |
| `extensions/beyondme-branding/` | Renames SillyTavern → beyondme in the interface |
| `summarize-prompt.txt` | The summariser prompt (event + "who knows what" tracking) |
| `settings-values.json` | The few settings the setup depends on |
| `launcher/` | The `beyondme` launcher, copied into your SillyTavern folder |
| `install.bat` / `install.sh` | Double-click (Windows) or run (Mac/Linux) to install |
| `install.js` | What those call — copies everything into place and patches the settings |

---

## Setup

> **Read this first — there are two downloads, and you need both.**
>
> - **SillyTavern** is the *app*. It's the program that runs the chat.
> - **beyondme** (this repo) is the *configuration* — the card, the prompts,
>   the UI. It is not a program and cannot run on its own.
>
> So: install the app, then copy this configuration into it.
> Think of SillyTavern as the game, and beyondme as the settings and mods.

### Step 1 — get the app

```bash
git clone https://github.com/SillyTavern/SillyTavern -b release
cd SillyTavern
```

### Step 2 — start it once, then close it

Run `Start.bat` (Windows) or `start.sh` (Linux/Mac), wait for it to open in the
browser, then close it. This makes it create the `data` folder that step 4
copies into. **Don't skip this** — the installer needs that folder to exist.

### Step 3 — get this configuration

```bash
git clone https://github.com/alokp07/BeyondMe
cd BeyondMe
```

### Step 4 — copy it into the app

**Windows:** double-click **`install.bat`**

**Mac / Linux:** `./install.sh`

If it can't find SillyTavern by itself, give it the path from step 1:

```bash
node install.js "C:\path\to\SillyTavern"
```

> No Python needed — the installer runs on **Node.js**, which SillyTavern
> already requires. If SillyTavern runs on the machine, this will too.

It prints everything it copies, and never touches your API keys, your chats,
or your persona.

### Step 5 — add your own API key

Start SillyTavern, then **API Connections**:
- API: **Chat Completion**
- Source: **Google AI Studio**
- Paste a key from [aistudio.google.com](https://aistudio.google.com/apikey) (free)
- Model: **gemini-3.5-flash-lite** for everyday use, **gemini-3.5-flash** for big scenes

### Step 6 — pick the preset

In the preset dropdown choose **Default** — that's where the tuned prompts live.

Open **College Roommates** and start.

---

## Opening it after that

The installer puts a **`beyondme`** launcher in your SillyTavern folder — use
that from now on, not `Start.bat`:

| | |
|---|---|
| **Windows** | double-click **`beyondme.bat`** |
| **Mac / Linux** | `./beyondme.sh` |

It's the same server, just leaner: `Start.bat` re-runs `npm install` on *every*
launch, which the launcher skips. A console window opens and stays open — that
**is** the app running, so leave it open while you play. Closing it stops the
server.

Then open **http://localhost:8000** in your browser.

> After a `git pull` that updates SillyTavern itself, run `Start.bat` **once**
> so new dependencies get installed, then go back to `beyondme.bat`.

---

## What the tuning actually does

- **Memory** — the whole chat is sent raw (200k context), plus a running summary
  and vector retrieval. Characters remember things from hundreds of messages back.
- **Summariser** — records events *and* who witnessed them, so a character can't
  react to something they never saw.
- **Perception rules** — knowing a person isn't the same as knowing their secret.
- **Anti-stagnation** — scenes must move; restating the last beat counts as a
  failed reply.
- **Prose rules** — one adjective per noun, varied sentence shape, distinct voices.

Free tiers meter **requests per day, not tokens**, so the context is deliberately
maximised — it costs nothing extra and the memory is much better for it.

---

## Playing on your phone

The UI is built phone-first. To reach it from your phone, run SillyTavern on a
computer and connect over [Tailscale](https://tailscale.com) (free):

1. Install Tailscale on both devices, sign in with the same account.
2. In SillyTavern's `config.yaml`: `listen: true`, `whitelistMode: false`,
   `basicAuthMode: true`, and set your own username/password.
3. On the phone, open `http://<computer's tailscale ip>:8000`.

For a fullscreen app icon you need HTTPS — `tailscale serve --bg 8000` gives you
a valid certificate, then "Install / Add to Home Screen" from the browser menu.

---

## Privacy

`.gitignore` blocks `secrets.json`, `chats/`, `backups/`, `vectors/` and
`settings.json`. Your keys and conversations stay on your machine. `install.js`
never reads them.

Everyone who installs this uses **their own API key**.
