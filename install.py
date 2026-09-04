#!/usr/bin/env python3
"""
beyondme installer.

Copies the character card, presets and UI extension into an existing
SillyTavern install, then patches the handful of settings the setup depends on.

It never touches your API keys, your chats, or your persona.

    python install.py "C:\\path\\to\\SillyTavern"
    python install.py            # tries to find SillyTavern near this folder
"""
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def find_sillytavern(explicit=None):
    """Locate a SillyTavern install by looking for data/default-user."""
    candidates = []
    if explicit:
        candidates.append(explicit)
    # common spots relative to this repo
    parent = os.path.dirname(HERE)
    candidates += [
        os.path.join(parent, "SillyTavern"),
        os.path.join(parent, "beyondme"),
        os.path.join(parent, "sillytavern"),
    ]
    for c in candidates:
        if c and os.path.isdir(os.path.join(c, "data", "default-user")):
            return c
    return None


def copy_tree(src, dst, label):
    if os.path.isdir(dst):
        shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst)
    print(f"  + {label}")


def main():
    root = find_sillytavern(sys.argv[1] if len(sys.argv) > 1 else None)
    if not root:
        print("Could not find SillyTavern.")
        print('Run:  python install.py "C:\\path\\to\\SillyTavern"')
        sys.exit(1)

    data = os.path.join(root, "data", "default-user")
    print(f"Installing into: {data}\n")

    # ---- 1. character card -------------------------------------------------
    os.makedirs(os.path.join(data, "characters"), exist_ok=True)
    for f in os.listdir(os.path.join(HERE, "characters")):
        shutil.copyfile(os.path.join(HERE, "characters", f),
                        os.path.join(data, "characters", f))
        print(f"  + characters/{f}")

    # ---- 2. presets (the tuned prompts + samplers) -------------------------
    os.makedirs(os.path.join(data, "OpenAI Settings"), exist_ok=True)
    for f in os.listdir(os.path.join(HERE, "OpenAI Settings")):
        shutil.copyfile(os.path.join(HERE, "OpenAI Settings", f),
                        os.path.join(data, "OpenAI Settings", f))
        print(f"  + OpenAI Settings/{f}")

    # ---- 3. the UI extension ----------------------------------------------
    os.makedirs(os.path.join(data, "extensions"), exist_ok=True)
    for ext in os.listdir(os.path.join(HERE, "extensions")):
        copy_tree(os.path.join(HERE, "extensions", ext),
                  os.path.join(data, "extensions", ext),
                  f"extensions/{ext}")

    # ---- 4. patch settings.json -------------------------------------------
    # Only the keys this setup depends on. Your API keys live in secrets.json
    # and are never read or written here.
    sp = os.path.join(data, "settings.json")
    if not os.path.exists(sp):
        print("\n! No settings.json yet — start SillyTavern once, then re-run this.")
        return

    s = json.load(open(sp, encoding="utf-8"))
    vals = json.load(open(os.path.join(HERE, "settings-values.json"), encoding="utf-8"))
    summary = open(os.path.join(HERE, "summarize-prompt.txt"), encoding="utf-8").read()

    pu = s.setdefault("power_user", {})
    oai = s.setdefault("oai_settings", {})
    mem = s.setdefault("extension_settings", {}).setdefault("memory", {})

    oai["temp_openai"] = vals["temp_openai"]
    for k in ("fast_ui_mode", "reduced_motion", "blur_strength", "shadow_width",
              "timestamps_enabled", "timestamp_model_icon", "chat_display",
              "sort_field", "sort_order"):
        pu[k] = vals[k]

    mem["prompt"] = summary
    mem["promptWords"] = vals["summary_promptWords"]

    json.dump(s, open(sp, "w", encoding="utf-8"), indent=4, ensure_ascii=False)
    print("  + settings.json patched (prompts, temperature, UI, summariser)")

    print("\nDone. Next:")
    print("  1. Start SillyTavern")
    print("  2. API Connections -> add YOUR OWN Google AI Studio key")
    print("  3. Pick the 'Default' preset, then open College Roommates")


if __name__ == "__main__":
    main()
