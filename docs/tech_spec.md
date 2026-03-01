# Rhymes Highlighted — Technical Specification

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5.9 | Type safety |
| Vite 7.3 | Build tool |
| MobX + mobx-react-lite | State management |
| Tailwind CSS 4 | Styling |
| Framer Motion | UI animations (available, used as needed) |
| ~~OpenRouter API~~ | ~~LLM rhyme detection~~ (removed) |

## Architecture: Three-Layer

```
UI Layer → Store Layer → Service Layer
```

- **UI Layer**: React components in `src/features/`. Observes MobX stores, dispatches actions. No business logic.
- **Store Layer**: MobX stores in `src/stores/`. Orchestrates services, holds state and business logic.
- **Service Layer**: Stateless functions in `src/services/`. API calls, audio control, timestamp computation.

## Data Model

Core types live in `src/core/types/index.ts`.

- **Word**: Individual word with position (lineIndex, wordIndex), optional rhymeGroupId, optional timing (startMs/endMs)
- **Line**: Array of Words + raw text
- **RhymeGroup**: id, color, optional `label` (phonetic/auto), optional `name` (user-set display name)
- **Project**: id, title, lines, rhymeGroups, optional audioFile

## Stores

### ProjectStore

- Holds the project document (lyrics, rhyme groups)
- Parses raw text into Line/Word objects
- Manages rhyme group CRUD (create, delete, merge, assign words, rename)
- Undo/redo stack (JSON serialization, max 50 entries)

### PlaybackStore

- Wraps HTMLAudioElement with observable state
- Tracks currentTimeMs via requestAnimationFrame sync
- Play/pause/seek/rate controls

### UIStore

- Editor mode (view/tag/sync), defaults to `tag`
- `selectedGroupId`: the active group for direct click-to-assign
- `selectedWordPositions`: multi-word selection buffer used when no group is active
- `clearWordSelection()`: clears multi-select without deactivating the active group
- Sync mode tracking (current word index)

## Services

### AudioService

- Singleton HTMLAudioElement management
- `loadAudioFromFile()`: Creates object URL from File input
- `getAudioElement()`: Returns shared audio element
- `disposeAudio()`: Cleanup

### TimestampService

- `computeEndTimestamps()`: Fills in endMs based on next word's startMs
- `clearTimestamps()`: Resets all timing data

## Manual Tagging UX

1. User pastes lyrics and clicks "Start Tagging" → `parseLyrics()` builds the Word/Line graph
2. Editor opens in Tag mode with the group panel visible on the right
3. User creates a group ("+ New Group" button or "+" in panel) → group is auto-activated (`selectedGroupId`)
4. User clicks words in the lyrics → each click calls `assignWordToGroup` or `removeWordFromGroup` (toggle)
5. Clicking a different group in the panel activates it — further word clicks target that group
6. Pressing 1–8 activates the corresponding group by sidebar position
7. Pressing Esc deactivates the active group and clears multi-select
8. Double-clicking a group name enters inline rename mode
9. Clicking the color swatch opens the native OS color picker

## Tap-to-Sync Flow

1. User uploads audio file
2. Enters sync mode (clears existing timestamps)
3. Audio plays from beginning
4. User presses Space for each word → records `startMs` from audio currentTime
5. Backspace undoes last tap, Escape stops sync
6. On finish, `computeEndTimestamps()` fills in endMs
7. During playback, words where `startMs <= currentTime < endMs` get active highlight
