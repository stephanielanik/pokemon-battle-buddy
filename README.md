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

## Version 0.6.2
- Settings → Export Backup saves a JSON copy of the team, profiles, selected game, and theme. Save it in Files or iCloud Drive.
- Settings → Import Backup validates a previously exported JSON file and asks before replacing the current team.
- More robust iPhone viewport sizing, including profile forms, headers, and navigation.
- Updates continue to preserve localStorage; deleting a Home Screen app can still delete its data. Backups must be exported manually.

## Version 0.6.3
- Search input now uses 16px text to avoid Safari's focus auto-zoom on iPhone.
- Search suggestions and their labels stay within the mobile viewport, even with long names.

## Version 0.6.4
- Use 16px input and select text throughout the Pokémon profile editor and settings to prevent iPhone Safari focus zoom.
- Reinforce width containment on profile forms and move fields.
