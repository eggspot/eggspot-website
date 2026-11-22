# eggspot.app

The Eggspot website, served by GitHub Pages at https://eggspot.app (`CNAME`). `www.eggspot.app` and
`http://` redirect to `https://eggspot.app`. Every push to `main` goes live within a few minutes.

Pages builds the site with Jekyll; `_config.yml` keeps this README off the site. The pages are static
HTML. App pages reuse the shell of an existing page (`/assets/contact.8Q8zlUds.css`,
the header and the footer); only the `<title>`, the meta description and the `<article>` change.

## One folder per app

Every store app gets the same set of pages, so each store listing has stable URLs:

| Path | Used as |
|---|---|
| `/<app>/` | The app's page: the App Store **Marketing URL** and the Google Play **website** |
| `/<app>/privacy/` | The privacy policy URL in both stores and in AdMob's consent message |
| `/<app>/support/` | The App Store **Support URL** and the Play support contact |
| `/<app>/terms/` | Terms of use, when the app has accounts or subscriptions |

Today: `/klondike/` (Big Card Solitaire), `/spider/`, `/freecell/`, `/tripeaks/` and `/pyramid/` (Spider, FreeCell,
TriPeaks and Pyramid Solitaire: Big Cards), `/mahjong/`, `/sudoku/`, `/blockpuzzle/` and `/harvestfair/` (Mahjong
Solitaire: Big Tiles, Sudoku: Big Numbers, Block Puzzle: Big Blocks and Harvest Fair: Big Merge), `/pagoda/` (Lên Chùa / Pagoda Prayer), `/hatchling/` (Hatchling Clash), `/pack-rules/` (Pack Rules) and
`/thousand-skies/` (Thousand Skies: 99 Heroes), `/hatch-rush/` (Hatch Rush), `/tippy-raft/` (Tippy Raft),
`/push-line/` (Push Line) and `/fishy-rules/` (Fishy Rules).

## app-ads.txt

`/app-ads.txt` tells ad buyers which ad accounts may sell ads in our apps. One file covers every app of
the company's AdMob account (publisher `pub-8117466086450640`); there is no file per app.

How AdMob checks an app: it reads the **developer website** in the app's App Store or Google Play listing,
takes its domain (`eggspot.app`, with `www.` dropped) and fetches `https://eggspot.app/app-ads.txt`. So
an app is verified only when its store listing has a developer website on `eggspot.app`.

Rules:

- Keep the file at the site root, as plain text. Never remove or edit Google's line:
  `google.com, pub-8117466086450640, DIRECT, f08c47fec0942fa0`.
- A new app in the same AdMob account needs **no change** to the file.
- When an app turns on **AdMob mediation**, append each ad network's lines from that network's own
  instructions (for example AppLovin, Unity Ads, Meta Audience Network). Never remove lines another app
  may still use.
- Keep `/robots.txt` in place. Without it GitHub Pages sometimes answers a 5xx for the missing file, and
  Google's crawlers treat a 5xx `robots.txt` as "do not crawl this site" for a while, which also stops
  them reading `app-ads.txt`.
- After a change, check `https://eggspot.app/app-ads.txt` answers 200 `text/plain`, then AdMob > Apps >
  app-ads.txt. Google can take up to 7 days to crawl the file again.

## Adding a new app with ads

1. Add `/<app>/`, `/<app>/privacy/` and `/<app>/support/` here. The privacy page names Google AdMob, the
   data it may collect, the consent form and (on iOS) the tracking prompt; `/klondike/privacy/` is the
   model.
2. In App Store Connect set the **Marketing URL** to `https://eggspot.app/<app>/` and the Support URL to
   `https://eggspot.app/<app>/support/`. In the Play Console set the **website** to
   `https://eggspot.app/<app>/`. Do this before the first release: the Marketing URL is part of a version,
   so a missing one waits for the next version.
3. In AdMob, add one app per platform in the company account, with its own ad units.
4. Once the app is live in a store, link each AdMob app to its listing: AdMob > Apps > the app > App
   settings > App store details > **Add**. Use this rather than "Apps to confirm" > "Finish setup", whose
   default creates a second AdMob app with a new app ID.
5. AdMob then verifies the app against `app-ads.txt` and reviews it (usually 2-3 days). Until both pass,
   ads serve at a limited rate.

Apps without ads (Lên Chùa) still get the same folder, so every listing follows one pattern.
