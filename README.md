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
| `public/index.html` | the entire site — terminal, vim, filesystem, the lot |
| `public/root/` | the virtual filesystem you walk around in |
| `public/root/fs.js` | the filesystem embedded as JS so `cat` works from `file://` too |
| `public/support.js` | the tiny component runtime |

No build step to run it — open `public/index.html` and it boots.

## the terminal

Genuine commands: `ls` (`-a`, `-l`), `cd`, `cat`, `pwd`, `vim`, `mkdir`, `rm`,
`clear`, `history`, `help`. Files you create with `vim`/`mkdir` are saved to
`localStorage` and survive a refresh — and `rm` only removes what *you* made; the
built-ins are safe.

<kbd>Tab</kbd> completes · <kbd>↑</kbd> <kbd>↓</kbd> walk history · <kbd>Ctrl</kbd>+<kbd>L</kbd> clears · `vim` then `:wq` to save.

## secrets

There are a handful. `help` won't list them — that's the point[.](https://marcuschiu.com)

A few breadcrumbs: the site has a pulse if you're idle, a sealed `/root` you can't
read yet, and a `console` that talks back if you open DevTools. Real terminals
reward curiosity; so does this one.

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
- idle screensaver → matrix rain after 60s of stillness
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

[github](https://github.com/TheRealMarcusChiu) · [linktree](https://linktr.ee/marcuschiu) · [email](mailto:marcuschiu9@gmail.com)

---

<sub>built by marcus · the answer is 42[^42] · made to be poked at</sub>

[^42]: it's also a command. so is `cake`. you're welcome.
