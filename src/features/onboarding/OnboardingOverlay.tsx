import { observer } from 'mobx-react-lite';
import { useUIStore } from '../../stores';

interface StepDef {
  title: string;
  body: string;
  anchor: 'sidebar' | 'lyrics' | 'lyrics-word' | 'toolbar' | 'header-help';
}

const STEPS: StepDef[] = [
  {
    title: 'Create a rhyme group',
    body: 'Click "+ Create first group" in the sidebar on the right. Each group is a color you\'ll assign to rhyming words.',
    anchor: 'sidebar',
  },
  {
    title: 'Click words to tag them',
    body: 'With a group selected, click any word in the lyrics to color-code it. Click again to remove. Words that rhyme together get the same group.',
    anchor: 'lyrics',
  },
  {
    title: 'Right-click for more options',
    body: 'Right-click any word to assign it to a specific group, create a new group, or split it into syllables for internal rhyme tagging.',
    anchor: 'lyrics-word',
  },
  {
    title: 'Use keyboard shortcuts',
    body: 'Press 1–8 to quickly switch between groups. Esc to deselect. Ctrl+Z to undo, Ctrl+Shift+Z to redo.',
    anchor: 'toolbar',
  },
  {
    title: 'Need help later?',
    body: 'Click the "?" button in the top-right corner anytime to see a full reference of all features and shortcuts.',
    anchor: 'header-help',
  },
];

export const OnboardingOverlay = observer(function OnboardingOverlay() {
  const ui = useUIStore();

  if (ui.onboardingStep === null) return null;

  const step = STEPS[ui.onboardingStep];
  if (!step) return null;

  const isLast = ui.onboardingStep === STEPS.length - 1;

  const positionClasses = getPositionClasses(step.anchor);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={() => ui.skipOnboarding()}
      />

      <div
        className={`absolute pointer-events-auto ${positionClasses} w-80 bg-surface-700 border border-white/15 rounded-xl shadow-2xl p-5 space-y-3`}
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-rhyme-purple/25 text-rhyme-purple text-xs font-bold flex items-center justify-center shrink-0">
            {ui.onboardingStep + 1}
          </span>
          <h3 className="text-sm font-semibold text-white">{step.title}</h3>
        </div>

        <p className="text-sm text-white/60 leading-relaxed">{step.body}</p>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => ui.skipOnboarding()}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === ui.onboardingStep ? 'bg-rhyme-purple' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => ui.nextOnboardingStep()}
              className="text-xs font-medium bg-rhyme-purple/20 hover:bg-rhyme-purple/35 text-rhyme-purple px-4 py-1.5 rounded-md transition-colors"
            >
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function getPositionClasses(anchor: StepDef['anchor']): string {
  switch (anchor) {
    case 'sidebar':
      return 'top-24 right-80';
    case 'lyrics':
      return 'top-32 left-1/2 -translate-x-1/2';
    case 'lyrics-word':
      return 'top-48 left-1/3';
    case 'toolbar':
      return 'bottom-20 left-1/2 -translate-x-1/2';
    case 'header-help':
      return 'top-14 right-8';
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}
