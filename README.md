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

- `neofetch` — me, rendered as system stats
- `git log` — me, rendered as commit history
- `sl` — for the inevitable time you mistype `ls`
- `man <anything>` · `theme green` · `matrix`
- the Konami code: <kbd>↑</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>B</kbd> <kbd>A</kbd>
- `sudo su`, then `cd /root` and `cat flag.txt` — the real prize
- `rm -rf /` … if you trust me
- and one or two I'm leaving for you to trip over

</details>
</details>

<!-- the flag itself isn't in this repo. it lives where only root can read it. you're close. -->

## Easter eggs implemented

**Hidden commands** (none appear in `help` or Tab-complete — discovery is the point):

- `sudo` → "not in the sudoers file. This incident has been reported." (`sudo make me a sandwich` works, though)
- `sudo su` / `su` → root mode: prompt turns red `root@home:~#`, `whoami` says `root`, unlocks the sealed `/root` dir
- `exit` / `logout` → CRT power-off animation (collapses to a dot) → "press any key to wake"; from root it just drops you back to marcus
- `sl` → ASCII steam locomotive chugs across the screen
- `man <cmd>` → tiny fake manual pages; `man woman` gag
- `neofetch` / `screenfetch` → about-me as system stats with an ASCII logo
- `git log` → your career as commit history; `git status` too
- `matrix` / `cmatrix` → green digital rain (any key dismisses)
- `theme [amber|green|blue|mono]` → swap CRT phosphor color (persists)
- `nano`/`emacs` (editor-war jabs), `42`, `cake`, `coffee`/`brew` (HTTP 418)

**Triggers & effects:**

- Konami code (↑↑↓↓←→←→ B A) → toggles green-phosphor mode
- Idle screensaver → matrix rain after 60s of stillness
- `rm -rf /` (and `~`, `.`) → dramatic fake deletion + screen glitch, then "just kidding" — deletes nothing

**Hidden files** (built-in, can't be `rm`'d; surfaced via `ls -a`):

- `~/.plan` (Unix finger tradition), `~/.secret`, `~/.ssh/id_rsa` (joke key — base64 decodes to a wink)
- `/root/flag.txt` (the reward: contact + "the cake is a lie" passphrase) and `/root/.bash_history`

**The breadcrumb trail (ARG):** DevTools `console.log` wink + an HTML source comment → both point to `ls -a` → `.secret` → `sudo su` → `/root/flag.txt`. Command history is also pre-seeded (`ls -a`, `cat .plan`, `neofetch`) so ↑/history nudge the curious.

**Plus:** ~1-in-16 loads show a brief fake BIOS/POST before login.

## elsewhere

[github](https://github.com/TheRealMarcusChiu) · [linktree](https://linktr.ee/marcuschiu) · [email](mailto:marcuschiu9@gmail.com)

---

<sub>built by marcus · the answer is 42[^42] · made to be poked at</sub>

[^42]: it's also a command. so is `cake`. you're welcome.
