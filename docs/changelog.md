# Rhymes Highlighted — Changelog

## 2026-02-19 — Manual Highlighter Conversion

### Changed

- **Removed AI layer**: Deleted `rhymeAnalysisService.ts` and `openRouterService.ts` entirely. The app is now a fully manual rhyme tagger — no API key required.
- **Simplified entry screen**: `LyricsInput` now has a single "Start Tagging" CTA instead of "Analyze with AI" / "Skip". Supports Ctrl+Enter shortcut.
- **Active-group click-to-tag**: Selecting a group in the sidebar activates it. Clicking any word immediately assigns/removes it from that group — no multi-select step needed.
- **Smart fallback click**: Clicking a tagged word when no group is active now activates that word's group directly.
- **Inline group renaming**: Double-click any group name in the sidebar to rename it inline.
- **Native color picker**: Group color swatches now open the OS-native color wheel (`<input type="color">`), giving access to all 16 million colors instead of 12 presets.
- **Active-group indicator in toolbar**: `ManualTagToolbar` prominently displays the active group name and color, with a dismiss button.
- **Keyboard shortcuts 1–8**: Press a number key to quickly activate a group by its position in the sidebar list.
- **Default Tag mode**: The editor now opens directly in Tag mode instead of View mode.
- **Removed "Re-analyze with AI" button** from `RhymeGroupPanel`.
- **Added `setGroupName` action** to `ProjectStore`.
- **Added `name?` field** to `RhymeGroup` type (separate from `label`).
- **Added `clearWordSelection`** to `UIStore` (clears multi-select without deactivating the active group).

### Technical Decisions

- Active group concept reuses existing `uiStore.selectedGroupId` — no new store state needed.
- Group display name priority: `name` > `label` > `Group N` (backward-compatible).
- Native `<input type="color">` is visually hidden behind the swatch; no external library needed.

---

## 2026-02-18 — Initial Build (Phases 1–4)

### Added

- **Project foundation**: React 19 + TypeScript + Vite + MobX + Tailwind CSS
- **Core data model**: Word, Line, RhymeGroup, Project types with 12-color rhyme palette
- **MobX stores**: ProjectStore (lyrics + rhymes + undo/redo), PlaybackStore (audio), UIStore (editor modes)
- **Lyrics input**: Textarea with song title, "Analyze with AI" and "Skip" options
- **LLM rhyme detection**: OpenRouter integration with structured JSON output, configurable model
- **Color-coded lyrics display**: WordSpan components colored by rhyme group
- **Rhyme group panel**: Shows all groups with word counts, color dots
- **Manual tagging**: Tag mode with click-to-select, right-click context menu, assign/remove/create groups
- **Color picker**: Inline picker for changing group colors from the 12-color palette
- **Group management**: Create, delete, merge groups; undo/redo with Ctrl+Z/Ctrl+Shift+Z
- **Audio upload & playback**: File upload, play/pause, seek slider, playback speed (0.5x–1.25x)
- **Tap-to-sync**: Spacebar-driven word timestamping during audio playback with progress indicator
- **Synced preview**: Words highlight in real-time as audio plays, matching their timestamps
- **Keyboard shortcuts**: Ctrl+Z undo, Ctrl+Shift+Z redo, Escape clear selection, Space/Backspace/Escape in sync mode

### Technical Decisions

- Three-layer architecture: UI → Store → Service
- OpenRouter structured output with `json_schema` response format for reliable rhyme analysis
- Undo/redo via JSON snapshot stack (max 50 entries)
- Audio sync via requestAnimationFrame polling of HTMLAudioElement.currentTime
- Tap-to-sync computes endMs from next word's startMs automatically
