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
| `install.py` | Copies everything into place and patches those settings |

---

## Setup

**1. Install SillyTavern**

```bash
git clone https://github.com/SillyTavern/SillyTavern -b release
cd SillyTavern
```
Run `Start.bat` (Windows) or `start.sh` (Linux/Mac) once so it creates its data
folder, then close it.

**2. Install beyondme**

```bash
git clone https://github.com/alokp07/BeyondMe
cd BeyondMe
python install.py "C:\path\to\SillyTavern"
```

**3. Add your own API key**

Start SillyTavern, then **API Connections**:
- API: **Chat Completion**
- Source: **Google AI Studio**
- Paste a key from [aistudio.google.com](https://aistudio.google.com/apikey) (free)
- Model: **gemini-3.5-flash-lite** for everyday use, **gemini-3.5-flash** for big scenes

**4. Pick the preset**

In the preset dropdown choose **Default** — that's where the tuned prompts live.

Open **College Roommates** and start.

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
`settings.json`. Your keys and conversations stay on your machine. `install.py`
never reads them.

Everyone who installs this uses **their own API key**.
