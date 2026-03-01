import { observer } from 'mobx-react-lite';
import { AudioPlayer } from './AudioPlayer';
import { SyncEditor } from '../sync/SyncEditor';

export const PlaybackControls = observer(function PlaybackControls() {
  return (
    <div className="p-4 space-y-4 border-t border-white/5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        Audio
      </h3>
      <AudioPlayer />
      <SyncEditor />
    </div>
  );
});
