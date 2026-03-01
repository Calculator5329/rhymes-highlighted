import { observer } from 'mobx-react-lite';
import { useProjectStore } from '../../stores';

export const LyricsInput = observer(function LyricsInput() {
  const project = useProjectStore();

  const handleStart = () => {
    if (!project.rawLyrics.trim()) return;
    project.parseLyrics();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Rhymes Highlighted
          </h1>
          <p className="text-white/40 text-sm">
            Paste your lyrics below, then tag rhyme schemes yourself — with full control over every group and color.
          </p>
        </div>

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
          className="w-full h-72 bg-surface-700 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none font-mono text-sm leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleStart();
          }}
        />

        <button
          onClick={handleStart}
          disabled={!project.rawLyrics.trim()}
          className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          Start Tagging
        </button>

        <p className="text-xs text-white/20 text-center">
          Ctrl+Enter to start &nbsp;·&nbsp; You can edit lyrics again at any time
        </p>
      </div>
    </div>
  );
});
