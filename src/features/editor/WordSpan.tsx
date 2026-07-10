import { observer } from 'mobx-react-lite';
import type { Word, RhymeGroup, EditorMode } from '../../core/types';

interface WordSpanProps {
  word: Word;
  group?: RhymeGroup;
  groupMap: Map<string, RhymeGroup>;
  mode: EditorMode;
  isSelected: boolean;
  /** True when this word belongs to the currently active group in the sidebar. */
  isInActiveGroup: boolean;
  isActive: boolean;
  isSyncTarget: boolean;
  isSynced: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const WordSpan = observer(function WordSpan({
  word,
  group,
  groupMap,
  mode,
  isSelected,
  isInActiveGroup,
  isActive,
  isSyncTarget,
  isSynced,
  onClick,
  onContextMenu,
}: WordSpanProps) {
  const isTagMode = mode === 'tag';
  const hasSyllables = word.syllables && word.syllables.length > 0;

  const wrapClasses = `
    inline-block mr-1.5 py-0.5 rounded-sm transition-all duration-100
    ${isTagMode ? 'cursor-pointer hover:bg-white/10 hover:underline decoration-white/20 underline-offset-2' : ''}
    ${isSelected ? 'ring-1 ring-white/60 bg-white/10' : ''}
    ${isInActiveGroup ? 'ring-1 ring-white/30' : ''}
    ${isActive ? 'scale-110 brightness-150' : ''}
    ${isSyncTarget ? 'bg-rhyme-cyan/20 ring-1 ring-rhyme-cyan/40 rounded' : ''}
    ${isSynced && !isActive ? 'opacity-50' : ''}
  `;

  if (hasSyllables) {
    return (
      <span
        onClick={isTagMode ? onClick : undefined}
        onContextMenu={onContextMenu}
        className={wrapClasses}
      >
        {word.syllables!.map((seg, i) => {
          const segGroup = seg.rhymeGroupId ? groupMap.get(seg.rhymeGroupId) : undefined;
          const segColor = segGroup?.color;
          return (
            <span
              key={i}
              className={segColor ? 'px-0.5 rounded-sm' : ''}
              style={{
                color: segColor ?? undefined,
                backgroundColor: segColor ? `${segColor}18` : undefined,
                textShadow: isActive && segColor ? `0 0 12px ${segColor}` : undefined,
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </span>
    );
  }

  const color = group?.color;
  return (
    <span
      onClick={isTagMode ? onClick : undefined}
      onContextMenu={onContextMenu}
      className={`${wrapClasses} ${color ? 'px-1 -mx-0.5' : ''}`}
      style={{
        color: color ?? undefined,
        backgroundColor: isSyncTarget
          ? undefined
          : color && !isSelected
            ? `${color}18`
            : undefined,
        textShadow: isActive && color ? `0 0 12px ${color}` : undefined,
      }}
    >
      {word.text}
    </span>
  );
});
