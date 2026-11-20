[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/dylikeu/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/dylikeu/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Cover Studio

A web app that turns your photo and a caption into GTA-style cover art, exported as a PNG to share. It runs offline in a desktop browser from its own static files — photos never leave your machine.

## How it works

1. **Add photos** — upload your own, or try the built-in samples (Boulevard, Pier).
2. **Pick a layout** — Hero (one big panel), Split (two panels), Trio (one large + two small), or Strip (three vertical panels). Click a panel to select it, drag to pan the photo inside, use the zoom slider to zoom.
3. **Pick a colour grade** — Sunset, Neon, Noir, or Gold. Each grade tints the photos and sets the sky, sun, and caption accent.
4. **Write the caption** — a title and a sub-caption, set in huge condensed Anton capitals with a black outline, tilted like a poster.
5. **Export** — a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080, ready to post.

## Run it

Serve `app/` with any static server, for example `node serve.ts`, then open http://localhost:8080. No build step, no network requests: the Anton font (`app/fonts/Anton-Regular.ttf`, SIL Open Font License) and the sample photos ship inside `app/`.

## Entry

`main.ts` (Node 22) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots live in `screenshots/`: the first by name is the cover. Everything in this repo is original work except the Anton font (OFL) and the two sample photos, which the kit ships free to use. No Rockstar Games logo, artwork, or font is used anywhere.

## License

MIT — see [LICENSE](LICENSE).
