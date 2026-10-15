# Pokémon Battle Buddy v0.1

Mobile-friendly, ad-free Pokémon type matchup lookup and six-Pokémon team tracker.

## Run locally

Open `index.html` in a browser. Internet access is required for Pokémon search and artwork (PokéAPI); the type matchup table itself is bundled locally. For best results, use VS Code Live Server or run `python3 -m http.server 8000` from this folder, then open http://localhost:8000.

## Publish on GitHub Pages

Create a public GitHub repository, upload the three files at the repository root, then go to Settings → Pages → Deploy from a branch → main / (root). After deployment, open the Pages URL on iPhone Safari and use Share → Add to Home Screen.

## Current features

- Search Pokémon by name or national Pokédex number, with autocomplete.
- Regional forms (Galarian/Alolan) where provided by PokéAPI.
- Type matchups including dual-type multipliers, resistances, and immunities.
- Save and remove up to six team members with localStorage.
- Gradient cards using type colors.

## Planned

Moves, abilities, Pokérus status, held items, Move Advisor, Team Analyzer, game-specific availability and location guides, offline Pokémon database.

## Notes

Saved teams are local to the browser/device. They do not automatically sync between Mac and iPhone. The app does not currently filter Pokémon or moves by game, and Pokémon lookup requires internet. No account or API key required.


## Version 0.2
- Game selector remembers Sword, Shield, Let's Go Pikachu/Eevee, or Legends: Z-A.
- In Sword/Shield, common Galarian regional forms are preferred when searching by the base species name; use the form buttons to switch. This is a convenience default, not a guarantee of which form is encountered.
- Autocomplete suggestions include small sprites and prioritize Galarian forms on search.
- Legends: Z-A is selectable for future expansion, but this version does not yet filter availability or use game-specific movesets.

## v0.3 theme update

- Electric-blue **Battle Mode** is the default.
- Switch to the original **Cozy Mode** using Appearance.
- Your theme preference is saved in the browser.
- Lookup, regional forms, and team data are unchanged.


## v0.4
Appearance and game settings are now in the gear dialog. The active game stays visible in a compact header chip. Preferences retain the same localStorage keys as v0.3.

## Version 0.5
- Regional forms display the National Pokédex species number, not PokéAPI form IDs.
- Settings button uses a theme-colored SVG icon instead of a platform-dependent emoji.

## Version 0.6 — Team Member Editor
- Tap **Edit** on a team card to customize nickname, level, ability, held item, four moves, and Pokérus status.
- Edits are saved locally alongside existing team records; previously saved teams remain compatible.
- Move names and abilities are free-text for now (no game-specific legality checking). Level is optional, from 1 to 100.
