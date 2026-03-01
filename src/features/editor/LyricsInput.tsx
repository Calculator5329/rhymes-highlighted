import { observer } from 'mobx-react-lite';
import { useProjectStore } from '../../stores';

const STEPS = [
  {
    number: '1',
    title: 'Paste your lyrics',
    description: 'Drop in any song lyrics or poem text',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <line x1="6" y1="6" x2="14" y2="6" />
        <line x1="6" y1="9.5" x2="14" y2="9.5" />
        <line x1="6" y1="13" x2="10" y2="13" />
      </svg>
    ),
  },
  {
    number: '2',
    title: 'Tag rhyme groups',
    description: 'Create color-coded groups, then click words to assign them',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="3" />
        <circle cx="13" cy="7" r="3" />
        <circle cx="10" cy="13" r="3" />
      </svg>
    ),
  },
  {
    number: '3',
    title: 'Sync to audio',
    description: 'Optionally upload a track and tap along to animate highlights',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10 Q5 4, 7 10 Q9 16, 11 10 Q13 4, 15 10 Q17 16, 19 10" />
      </svg>
    ),
  },
];

export const LyricsInput = observer(function LyricsInput() {
  const project = useProjectStore();

  const handleStart = () => {
    if (!project.rawLyrics.trim()) return;
    project.parseLyrics();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Rhymes Highlighted
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-lg">
            A visual tool for tagging rhyme schemes in lyrics and poetry.
            Color-code rhyming words, organize them into groups, and optionally
            sync highlights to audio playback.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-4 space-y-2"
            >
              <div className="flex items-center gap-2.5 text-white/50">
                {step.icon}
                <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
                  Step {step.number}
                </span>
              </div>
              <p className="text-sm font-medium text-white/80">{step.title}</p>
              <p className="text-xs text-white/35 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          <input
            type="text"
            placeholder="Song title (optional)"
            value={project.project.title === 'Untitled' ? '' : project.project.title}
            onChange={(e) => project.setTitle(e.target.value || 'Untitled')}
            className="w-full bg-surface-700 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 text-sm"
          />

          <textarea
            value={project.rawLyrics}
            onChange={(e) => project.setRawLyrics(e.target.value)}
            placeholder={`Paste your lyrics here...\n\nExample:\nLook, if you had one shot or one opportunity\nTo seize everything you ever wanted, in one moment\nWould you capture it, or just let it slip?`}
            className="w-full h-56 bg-surface-700 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none font-mono text-sm leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleStart();
            }}
          />

          <button
            onClick={handleStart}
            disabled={!project.rawLyrics.trim()}
            className="w-full bg-rhyme-purple/15 hover:bg-rhyme-purple/25 border border-rhyme-purple/20 hover:border-rhyme-purple/35 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            Start Tagging
          </button>

          <p className="text-xs text-white/20 text-center">
            Ctrl+Enter to start &nbsp;·&nbsp; You can edit lyrics again at any time
          </p>
        </div>
      </div>
    </div>
  );
});
