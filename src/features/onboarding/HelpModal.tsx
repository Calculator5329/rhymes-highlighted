import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useUIStore } from '../../stores';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <span className="shrink-0 text-xs font-mono bg-white/8 text-white/60 px-2 py-0.5 rounded min-w-[110px] text-center">
        {label}
      </span>
      <span className="text-sm text-white/50">{description}</span>
    </div>
  );
}

export const HelpModal = observer(function HelpModal() {
  const ui = useUIStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ui.showHelpModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        ui.closeHelpModal();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [ui, ui.showHelpModal]);

  if (!ui.showHelpModal) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === backdropRef.current) ui.closeHelpModal();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative bg-surface-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-base font-semibold text-white">How to use Rhymes Highlighted</h2>
          <button
            onClick={() => ui.closeHelpModal()}
            className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Section title="Tagging basics">
            <p className="text-sm text-white/50 leading-relaxed">
              Select a <strong className="text-white/70">rhyme group</strong> in the sidebar,
              then <strong className="text-white/70">click words</strong> in the lyrics to assign them that color.
              Click an assigned word again to remove it. Words that rhyme together should share the same group.
            </p>
          </Section>

          <Section title="Right-click menu">
            <p className="text-sm text-white/50 leading-relaxed">
              Right-click any word for more options: assign to a specific group,
              create a new group from that word, or <strong className="text-white/70">split into syllables</strong> to
              tag internal rhymes (e.g. "whirl|winds").
            </p>
          </Section>

          <Section title="Group management">
            <Row label="Click swatch" description="Open color picker to change a group's color" />
            <Row label="Double-click" description="Double-click a group name to rename it" />
            <Row label="Merge (&#8644;)" description="Click merge on one group, then click another to combine them" />
            <Row label="Delete (&times;)" description="Remove a group (words become untagged)" />
          </Section>

          <Section title="Keyboard shortcuts">
            <Row label="1 – 8" description="Quick-select a rhyme group by its sidebar position" />
            <Row label="Esc" description="Deselect the active group and clear word selection" />
            <Row label="Ctrl+Z" description="Undo last action" />
            <Row label="Ctrl+Shift+Z" description="Redo last undone action" />
            <Row label="Ctrl+S" description="Save project to browser storage" />
          </Section>

          <Section title="Audio sync (optional)">
            <p className="text-sm text-white/50 leading-relaxed">
              Upload an audio file in the sidebar, then click
              <strong className="text-white/70"> "Start tap-to-sync"</strong>.
              Press <strong className="text-white/70">Space</strong> as each rhyming word is sung.
              Press <strong className="text-white/70">Backspace</strong> to undo the last tap,
              <strong className="text-white/70"> Esc</strong> to stop.
              During playback, synced words highlight in real time.
            </p>
          </Section>

          <Section title="Saving your work">
            <p className="text-sm text-white/50 leading-relaxed">
              <strong className="text-white/70">Save</strong> stores your project in the browser.
              <strong className="text-white/70"> Download</strong> exports a JSON file you can share.
              <strong className="text-white/70"> Import</strong> loads a previously downloaded file.
              <strong className="text-white/70"> Open</strong> switches between saved projects.
            </p>
          </Section>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => {
              ui.closeHelpModal();
              ui.restartOnboarding();
            }}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Restart guided tour
          </button>
          <button
            onClick={() => ui.closeHelpModal()}
            className="text-xs font-medium bg-white/10 hover:bg-white/15 text-white/70 px-4 py-1.5 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
