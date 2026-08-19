# marcus@home

<!--
   you're reading the raw markdown. good instinct — that's exactly how this works.
   the live terminal keeps secrets the rendered page won't tell you.

   first move:   ls -a      (then think like it's 1995)
   then:         cat .secret

   when you find the flag, email me and say "the cake is a lie" so I know you dug.
                                                                        — marcus

   one for the road:   echo "eW91IGRlY29kZWQgaXQuIG9mIGNvdXJzZSB5b3UgZGlkLiBub3c6IHN1ZG8gc3UgLT4gY2QgL3Jvb3QgLT4gY2F0IGZsYWcudHh0" | base64 -d
-->

A personal site that boots like a terminal. `cat README.txt`, `ls` around, run a
`./script.sh` to open a link. It's one HTML file doing too much: CRT glow and
scanlines, a working modal `vim`, and a virtual filesystem that persists in your
browser between visits.

→ **[marcuschiu.com](https://marcuschiu.com "once you're in, type `help` — then forget help exists")** · type `help` to look around.

## what's in here

| path | what |
| --- | --- |
| `index.html` | the entire site — terminal, vim, filesystem, the lot |
| `root/` | the virtual filesystem you walk around in |
| `root/fs.js` | the filesystem embedded as JS so `cat` works from `file://` too |
| `support.js` | the tiny component runtime |
| `build.js` | (in `server/`) walks `./root` and regenerates `manifest.json` + `root/fs.js` |
| `server/server.js` | optional admin backend for publishing `NOW.txt` (see below) |

No build step to run it — open `index.html` and it boots. After editing anything
under `./root`, run `node server/build.js` to regenerate the filesystem bundle.

## the terminal

Genuine commands: `ls` (`-a`, `-l`), `cd`, `cat`, `pwd`, `vim`, `mkdir`, `rm`,
`clear`, `history`, `help`. Files you create with `vim`/`mkdir` are saved to
`localStorage` and survive a refresh — and `rm` only removes what *you* made; the
built-ins are safe.

<kbd>Tab</kbd> completes · <kbd>↑</kbd> <kbd>↓</kbd> walk history · <kbd>Ctrl</kbd>+<kbd>L</kbd> clears · `vim` then `:wq` to save.

## the /now page

Visiting **`/now`** (or `?now` / `#now`) auto-runs `cat NOW.txt` on boot instead of
the README — a snapshot of what I'm currently focused on. `NOW.txt` always looks
like:

```
last updated: July 1, 2026

…what I'm working on…

more: cat README.txt
```

## admin mode

Press <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>E</kbd> to open an admin panel that composes and
publishes `NOW.txt`. It talks to `server.js` over a configurable endpoint (set it in
the panel; saved to `localStorage`, with an optional token). Three actions:

- **New NOW** — pick a date (defaults to today) + content, then **Publish**. The
  server archives the current `NOW.txt` into `root/home/marcus/NOW/YYYY-MM-DD-NOW.txt`
  (the date parsed from its first `last updated:` line), writes the new one
  (whose footer points readers at that archive via `ls NOW` / `cat NOW/…`),
  reruns `server/build.js`, and `git commit && git push`.
- **Edit current** — overwrite `NOW.txt` in place (no archive).
- **Edit archive** — fix up any past `NOW/` entry.
- **README.txt** — edit the site's intro (freeform, no date), rebuild & push.

Run the backend alongside the static site:

```
node server/server.js                 # http://localhost:8787
ADMIN_TOKEN=secret node server/server.js   # require X-Admin-Token on writes
NO_GIT=1 node server/server.js        # test locally without pushing
```

Std-lib only, no dependencies. Serving the page over `https` while pointing at
`http://localhost` works thanks to the browser's localhost exception; for a remote
box, front `server.js` with https.

## secrets

There are a handful. `help` won't list them — that's the point[.](https://marcuschiu.com)

A few breadcrumbs: a sealed `/root` you can't read yet, and a `console` that talks
back if you open DevTools. Real terminals reward curiosity; so does this one.

<details>
<summary>I gave up — show me (spoilers, obviously)</summary>

<br>

> you clicked it. respect — but also, go play first. it's more fun blind.

<details>
<summary>…you're sure?</summary>

<br>

Try these in the live terminal — none of them appear in `help`:

- run `eggs` to list **every** hidden command, and `achievements` to see how many you've found
- `neofetch` / `git log` — me, as system stats / commit history
- `snake` — yes, a real game · `sl` · `fortune` · `cowsay hi`
- `man <anything>` · `theme green` · `matrix` · `degauss` · `sound on`
- the Konami code: <kbd>↑</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>B</kbd> <kbd>A</kbd>
- `sudo su`, then `cd /root` and `cat flag.txt` — the real prize
- `rm -rf /` … if you trust me

</details>
</details>

<!-- the flag itself isn't in this repo. it lives where only root can read it. you're close. -->

## Easter eggs implemented

`help` and Tab-complete hide all of these on purpose. Two commands reveal them
in-terminal: **`eggs`** lists every hidden command, and **`achievements`** tracks how
many of the ~27 secrets you've found (`12/27`, the rest shown as `???`, persisted).

**Hidden commands**

- `sudo` → "not in the sudoers file. This incident has been reported." (`sudo make me a sandwich` works, though)
- `sudo su` / `su` → root mode: prompt turns red `root@home:~#`, `whoami` says `root`, unlocks the sealed `/root`
- `exit` / `logout` → CRT power-off (collapses to a dot) → "press any key to wake"; from root it just drops you back to marcus (`reboot`/`shutdown` too)
- `neofetch` / `screenfetch` → about-me as system stats with an ASCII logo
- `git log` → career as commit history (`git status` too)
- `marcus` → me as a CLI: `marcus hire` · `now` · `contact` · `quote` · `--version` · `--json`, plus free-text Q&A (`marcus are you hiring?`). Hinted by `which marcus`
- `fortune` → a line from the quote pile · `cowsay <text>` · `finger marcus` → prints `~/.plan`
- `sl` → ASCII steam locomotive · `man <cmd>` (try `man marcus`, `man woman`)
- `top`/`htop`, `ps`, `uptime`, `df`, `who`/`w`, `dmesg` → fake system inspectors, joke output
- `hack [target]` → Hollywood breach sequence, then "just kidding"
- `matrix` / `cmatrix` → green digital rain (any key dismisses)
- `snake` → a real playable game (arrows/WASD, `q` quits, high score persists)
- `tic-tac-toe` / `wargames` → "the only winning move is not to play."
- `qr` → an ASCII QR to the linktree
- `theme [amber|green|blue|mono]` → swap CRT phosphor colour (persists)
- `degauss` → the CRT colour-wobble · `tv` → static + NO SIGNAL
- `sound on` / `off` → keystroke clicks + a CRT power-on thunk (Web Audio, opt-in)
- jabs & jokes: `nano`/`emacs`/`ed`, `make love`, `xyzzy`, `which marcus`, `ssh marcus@home`, `source ~/.bashrc`, `brew install <x>`, `42`, `cake`, `coffee`, `cat index.html`, `!!`, and the fork bomb `:(){ :|:& };:`

**Triggers & ambient effects**

- Konami code (↑↑↓↓←→←→ B A — or a gamepad) → toggles green-phosphor mode
- `rm -rf /` (and `~`, `.`) → dramatic fake deletion + screen glitch, then "just kidding" — deletes nothing
- phosphor ghosting when you `clear` · a time-aware greeting + visit-count milestones · low-battery "running on fumes"
- mobile: shake to `degauss`, tilt to slide the warm glow
- ~1-in-16 loads show a fake BIOS/POST; ~1-in-50 an Amiga "Guru Meditation" crash
- open DevTools for a `console` wink that points the way

**Hidden files** (built-in, can't be `rm`'d; surfaced via `ls -a`)

- `~/.plan` (the finger tradition, also shown by `finger`), `~/.secret`, `~/.ssh/id_rsa`
- `/root/flag.txt` (the reward) and `/root/.bash_history`

**The trail (ARG)** — a `console.log` wink and an HTML source comment both point to
`ls -a` → `.secret` → `sudo su` → `/root/flag.txt`. For the truly stubborn there's a
deeper layer: `cat ~/.ssh/id_rsa` decodes **base64 → ROT13 → `run: prestige`**, and
`prestige` is the final reward. History is pre-seeded (`ls -a`, `cat .plan`,
`neofetch`) so ↑/`history` nudge the curious; finds persist in `localStorage` and
`achievements` is the scoreboard.

## elsewhere

[github](https://github.com/TheRealMarcusChiu) · [linktree](https://linktr.ee/marcuschiu) · [email](mailto:marcuschiu@proton.me)

---

<sub>built by marcus · the answer is 42[^42] · made to be poked at</sub>

[^42]: it's also a command. so is `cake`. you're welcome.
