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
