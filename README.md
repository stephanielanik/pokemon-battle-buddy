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

## Version 0.7.0 — Move Advisor
- Search an opponent to rank damaging moves recorded in your saved team.
- Ranking uses move base power, type effectiveness, STAB and accuracy from PokéAPI. Status moves are excluded.
- This is a heuristic, not an exact damage calculation; stats, abilities, held items and battle conditions are not modeled.
- Move information requires internet. Team data remains saved locally.

## Version 0.7.1
- Compact results: Move Advisor comes before Type Effectiveness, and Add to My Team sits directly under the Pokémon card.
- Show three move recommendations initially, with a button to reveal the remaining ranked moves.
- Type Effectiveness is collapsible, with expandable groups for super effective, neutral, resisted, and immune attacks.

## Version 0.7.2
- Combine Type Effectiveness and Move Advisor into a single panel.
- Each expandable type category shows matching damaging moves from your saved team, ranked within that category.
- Show two moves initially per category; expand to see additional moves.

## Version 0.8.0 — Pokémon Box
- My Team now has Party and Box views. Move Pokémon between them without losing profile information.
- The Box is not limited to six Pokémon; party remains limited to six.
- Each captured Pokémon gets a unique record ID, so multiple of the same species retain independent profiles.
- Existing party records migrate automatically, and backup schema v2 exports/imports party plus Box. Old schema v1 backups remain importable.
- Removing the Home Screen app may still delete local data; export a backup to Files or iCloud Drive.

## Version 0.9.0 — Evolution Tracker
- View evolution paths and requirements on each party or boxed Pokémon profile.
- Displays remaining levels when the next evolution has a level requirement.
- Evolution data comes from PokéAPI; special conditions and game-specific exceptions may require verification.
- Does not automatically change a Pokémon's species or overwrite its profile.

## Version 1.0.0 — Team Analyzer
- Party-only analysis of shared defensive weaknesses, resistances and immunities.
- Offensive coverage across 18 defending types using damaging moves recorded in party profiles.
- Collapsible sections for coverage and gaps; boxed Pokémon are excluded.
- Type-based estimates only: not a full damage simulator, and single-type offensive coverage does not guarantee coverage against every dual-type combination.

## Version 1.1.0 — TM/TR Bank
- My Team → TM/TR Bank includes the full 100 TMs and 100 TRs for Sword and Shield, searchable by number or move name.
- Mark reusable TMs as owned and record quantities of single-use TRs (0–999).
- Inventory is stored separately for Sword and Shield; other games are explicitly unsupported in this release.
- Backups schema v3 includes TM/TR banks and continues to import v1/v2 backups.
- Recording TR usage is manual; teaching compatibility and move suggestions are planned for a later release.
- Machine names sourced from Pokémon Database's Sword/Shield TM/TR list: https://pokemondb.net/sword-shield/tms

## Version 1.1.1
- Compact horizontal Pokémon cards in Party and Box: artwork left, name/types/actions right.
- Keeps profile editing and party swapping behavior unchanged.

## Version 1.2.0 — Move Improvement Advisor
- Profile accordion shows owned TM/TR moves compatible with that Pokémon's Sword/Shield machine learnset, excluding moves already recorded.
- Team Analyzer suggests compatible owned moves that could fill uncovered defending-type gaps.
- Uses PokéAPI Sword/Shield version-group machine learn methods; internet required.
- Suggestions do not teach moves or consume TR inventory. Other games are not supported yet.

## Version 1.3.0 — Compare Moves
- Teachable TM/TR recommendations now offer an expandable comparison with the Pokémon's recorded moves.
- Suggests a potential move to replace based on rough power, base physical/special attack, STAB and accuracy, while noting type coverage.
- Comparisons are advisory: move effects, priority, abilities, defensive stats, and battle conditions are not fully modeled.
- No move or TR inventory changes happen automatically.

## Version 1.3.1 — Move type badges
- Elemental type colors in TM/TR bank, saved moves, move comparisons and TM/TR recommendations.
- Type information uses PokéAPI with throttled requests and memory caching; unavailable moves remain uncolored.

## Version 1.4.0 — Box Recommendations
- Team Analyzer recommends up to three boxed Pokémon that improve overall defensive type balance.
- Evaluates every potential one-for-one swap when the party is full; considers adding to an open slot otherwise.
- Shows suggested swap, reduced shared weaknesses and possible trade-offs.
- Suggestions are informational: no automatic swaps or changes to saved data.
- This first version scores defensive types only; offensive moves and abilities are not included in the ranking.

## Version 1.4.1 — Quick Add to Box
- Search and add a Pokémon directly from the Box view without opening Lookup or a full profile.
- Preview artwork, types and available regional forms before adding.
- Each addition creates an independent saved Pokémon record, including duplicates of the same species.

## Version 1.5.0 — Learn New Move
- In Pokémon profiles, compare a proposed move against the four current moves.
- Shows move type, category, power, accuracy, and priority, with a cautious replacement suggestion.
- Select the move to forget and confirm to update the saved profile. TM/TR inventory is unaffected.
- Requires PokéAPI internet access; recommendations are estimates, not full battle calculations.

## Version 1.5.1 — Smarter Learn New Move recommendations
- Account for multi-hit attacks (including Double Kick), coverage gained or lost, priority, stat boosts, ailments and healing/drain utility.
- Evaluate each possible replacement by its impact on the complete four-move set, rather than only comparing individual power values.
- Show coverage trade-offs and flag uncertain upgrades. Still advisory; special mechanics and battle-specific effects are not fully modeled.

## Version 1.5.2 — Profile layout
- Current moves and Save appear before Learn New Move and TM/TR suggestions.
- Evolution Tracker is moved to the bottom and collapsed by default.

## Version 1.6.0 — Smart Battle Recommendations
- Lookup now shows top three Pokémon to send, balancing their best recorded damaging move with defensive risk from opponent type(s).
- Each recommended move also shows a defensive risk label, including 2× and 4× vulnerabilities.
- The risk estimate assumes possible opponent same-type attacks; it does not know the opponent's actual moves, speed, abilities, or battle conditions.
- Party and profile data are unchanged.

## Version 1.6.1 — Smarter move decisions
- Warn about self-KO, recoil, recharge turns, two-turn attacks, and self-stat drops.
- Apply penalties in rough move ranking and avoid calling Self-Destruct a straightforward damage upgrade.
- Remove repeated elemental type text from comparison details when a type badge is already shown.
- All move decisions remain advisory and require explicit confirmation.

## Version 1.6.2 — Clear skip recommendations
- Self-KO moves and moves with no clear overall upgrade default to Keep Current Moves rather than preselecting a replacement.
- Choosing a replacement remains possible and updates the confirmation button.
- Self-KO warnings are displayed once rather than repeated.
