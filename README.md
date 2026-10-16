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

## Version 1.6.3 — Status move decisions
- Opponent stat reductions (such as Cotton Spore lowering Speed) are recognized as benefits rather than self-inflicted drawbacks.
- Strongly discourages replacing a damaging move if that would leave fewer than two damaging moves; never recommends losing the last attack by default.
- Displays status once instead of 'Status · Status'.
- Users may still override the recommendation and choose a move to replace.

## Version 1.6.4 — Smarter move replacements
- Prioritizes replacing a weaker same-type damaging move when the candidate is a meaningful improvement for that Pokémon's base attacking stats.
- Avoids sacrificing useful status moves merely to add a stronger attack of a type already covered.
- Retains coverage and minimum damaging-move safeguards; all choices still require confirmation.

## Version 1.6.5
- Clear the opponent Lookup search text when the search field receives focus, so another Pokémon can be entered immediately. Existing results remain visible until the next search.

## Version 1.7.0 — Evolve Pokémon
- Evolution Tracker now offers buttons for immediate next-stage evolutions.
- Confirmed evolution updates the existing individual record's species, Pokédex number, artwork, and types while retaining nickname, level, recorded moves, held item, Pokérus and other profile details.
- Ability and moves should be reviewed after evolving, since legal abilities and move availability can change.
- Evolution is never automatic; the user confirms the change.

## Version 1.7.1 — Better move explanations
- Learn New Move explanations now mention relevant Attack vs. Special Attack differences, including base stat values.
- Highlight notable secondary effects such as status chances, flinching, healing, and priority when known.
- Keeps existing move ranking and user confirmation safeguards; effects are advisory, not a full battle simulator.

## Version 1.7.2 — Lookup Box action and move effect improvements
- Add a searched Pokémon directly to Box without opening its profile, preserving duplicate-species support.
- Compare move utility with additional consideration for paralysis chance, flinching, critical hits, and selected Speed-boosting effects.
- Flag notable effects lost by replacing an existing move. These remain heuristic suggestions, not full damage or battle simulations.

## Version 1.7.3
- Keep Lookup autocomplete suggestions within the visible iPhone viewport when the on-screen keyboard appears.
- Increase suggestion tap targets and dismiss the keyboard when a suggestion is selected.

## Version 1.7.4
- Display Box count in parentheses to distinguish the count from a Box number.
- After adding a Pokémon to Box from Lookup or Quick Add, offer a direct Edit Pokémon button for that exact saved record.
- The edit shortcut resets when starting another search. No automatic profile navigation or data loss.

## Version 1.8.0 — Navigation cleanup
- Three top-level tabs: Lookup, My Pokémon, TM/TR Bank.
- My Pokémon has Party and Box views, compact counts, and an Add Pokémon control that opens Box quick search on demand.
- Team Analyzer is collapsed by default under Party. Existing data and storage keys remain unchanged.

## Version 1.8.1 — Critical startup fix
- Remove stale teamCount DOM reference after navigation cleanup. The missing element prevented initialization, Settings, and rendering of saved local Pokémon.
- Does not clear or migrate localStorage. Existing data should reappear once the app loads.

## Version 1.9.0 — Team synergy recommendations
- Compare defensive switch-ins, 4x weaknesses, immunities, and whole-team offensive coverage from recorded moves.
- Penalize losing unique move coverage and adding redundant types; flag lower-level replacements and Huge Power/Pure Power abilities for review.
- Recommend no swap when gains are too small to justify one. No automatic party changes.
- Rankings are heuristic and do not model full battle stats or abilities.

## Version 1.9.1 — Box readiness estimates
- Fetch base stats and species evolution information from PokéAPI and combine them with recorded levels and moves.
- Group promising swaps as Ready to Swap or Worth Training; caution about large level gaps, low defensive bulk, lower attacking potential, unevolved replacements, and powerful defensive or offensive abilities.
- Missing profile information prevents confident Ready to Swap labels. No automatic swaps; calculations remain heuristic.

## Version 1.9.2 — Emergency startup repair
- Correct malformed regular expression in evolution chain lookup introduced in 1.9.1, which prevented the entire app script from parsing.
- No storage changes or data migrations.

## Version 1.9.3 — Remove from Box
- Box Pokémon cards now include Remove, with a confirmation before deleting that specific stored Pokémon profile.
- Party cards retain Move to Box rather than permanent removal.
- Deleted profiles can only be restored from a previously exported backup.

## Version 1.10.0 — Ability-aware opponent attacks
- Lookups apply guaranteed opponent ability immunities to move rankings, including Haunter's Levitate immunity to Ground attacks.
- Where multiple regular abilities are possible, show a caution rather than guessing the active ability.
- Blocked moves display 0x actual effectiveness and cannot become Best Pokémon to Send recommendations.
- This is limited to standard ability-based type immunities; Mold Breaker, held items, field conditions, and special move exceptions are not fully modeled.

## Version 1.10.1 — Quick levels
- Compact level display beside Pokémon names in Party and Box.
- Tap + to increment and save immediately; tap the level number to enter a specific level (1–100).
- No card rebuild or scroll jump on level changes; saved profiles remain unchanged except for the selected Pokémon's level.

## Version 1.10.2 — Drag to reorder Pokémon
- Drag the small handle on Party or Box cards to reorder Pokémon within that collection.
- Order is saved to existing localStorage records without changing profiles or moving Pokémon between Party and Box.
- Keyboard users can focus a handle and use Arrow Up / Arrow Down.
