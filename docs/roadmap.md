# Rhymes Highlighted — Roadmap

## Vision

A web app where you paste lyrics, manually tag rhyme schemes with full color and label customization, sync highlights to audio playback, and preview Genius-style animated rhyme breakdowns.

## Phases

### Phase 1: Foundation [x]

- [x] Vite + React 19 + TypeScript scaffold
- [x] MobX stores (ProjectStore, PlaybackStore, UIStore)
- [x] Tailwind CSS with custom rhyme color palette
- [x] Core types (Word, Line, RhymeGroup, Project)
- [x] Basic app shell layout

### Phase 2: Lyrics Input + Display [x]

- [x] LyricsInput component with textarea and single "Start Tagging" CTA
- [x] LyricsDisplay with color-coded WordSpan components
- [x] RhymeGroupPanel showing groups

### Phase 3: Manual Rhyme Editing [x]

- [x] Active-group click-to-tag (click a group, then click words to instantly assign)
- [x] Selection mode for multi-word assignment when no group is active
- [x] Right-click context menu (assign, remove, new group)
- [x] Full color picker per group (native OS color wheel via `<input type="color">`)
- [x] Inline group renaming (double-click name to edit)
- [x] Group merge functionality
- [x] Undo/redo with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- [x] 1–8 keyboard shortcuts to quick-select groups
- [x] ManualTagToolbar showing active group and selection actions

### Phase 4: Audio Sync [x]

- [x] Audio file upload (any format via HTML5 Audio)
- [x] Audio playback controls (play/pause, seek, speed)
- [x] Tap-to-sync mode (spacebar per word)
- [x] Sync progress indicator
- [x] Synced playback preview (words highlight as audio plays)
- [x] Undo last tap (Backspace), stop sync (Escape)

### Phase 4.5: First-Time User Experience [x]

- [x] "How it works" step cards on landing page
- [x] 5-step guided onboarding tour (localStorage-persisted)
- [x] Persistent help modal with full feature reference
- [x] Enhanced empty states and contextual hints
- [x] Friendlier mode labels (Read / Tag Rhymes)
- [x] Visual affordance improvements (hover underline, instructional banners)

### Phase 5: Video Export (Future)

- [ ] Remotion integration
- [ ] Composition rendering LyricsDisplay frame-by-frame
- [ ] Remotion Player preview in app
- [ ] MP4 export via `npx remotion render`

### Phase 6: Enhancements (Future)

- [ ] Whisper-based automatic audio alignment
- [ ] LRC file import for pre-timed lyrics
- [ ] Save/load projects to localStorage
- [ ] Share via URL (compressed base64 encoding)
- [ ] Multiple color palettes / themes
- [ ] Responsive mobile layout
