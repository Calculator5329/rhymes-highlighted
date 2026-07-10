import { describe, expect, it } from 'vitest';
import { parseLrc } from './lrcService';

describe('parseLrc', () => {
  it('parses timestamped lyrics into timed lines and words', () => {
    const result = parseLrc('[00:01.25]Hello bright world\n[01:02.345]Second line');

    expect(result.lines.map(line => line.rawText)).toEqual(['Hello bright world', 'Second line']);
    expect(result.lines[0].words).toEqual([
      { text: 'Hello', lineIndex: 0, wordIndex: 0, startMs: 1250, endMs: 62345 },
      { text: 'bright', lineIndex: 0, wordIndex: 1, startMs: 1250, endMs: 62345 },
      { text: 'world', lineIndex: 0, wordIndex: 2, startMs: 1250, endMs: 62345 },
    ]);
    expect(result.lines[1].words[0]).toMatchObject({ startMs: 62345, endMs: 62845 });
  });

  it('extracts title and artist metadata without creating lyric lines', () => {
    const result = parseLrc('\uFEFF[ti: A Song ]\r\n[ar:The Artist]\r\n[00:00.00]Opening');

    expect(result.metadata).toEqual({ title: 'A Song', artist: 'The Artist' });
    expect(result.lines).toHaveLength(1);
  });

  it('supports centiseconds, tenths, whole seconds, and multiple timestamps', () => {
    const result = parseLrc([
      '[00:03]Whole',
      '[00:02.5]Tenth',
      '[00:01.05][00:04.050]Chorus',
    ].join('\n'));

    expect(result.lines.map(line => [line.rawText, line.words[0].startMs])).toEqual([
      ['Chorus', 1050],
      ['Tenth', 2500],
      ['Whole', 3000],
      ['Chorus', 4050],
    ]);
    expect(result.lines.map(line => line.words[0].lineIndex)).toEqual([0, 1, 2, 3]);
  });

  it('skips blank, unsupported, and malformed lines', () => {
    const result = parseLrc([
      'plain text',
      '[al:Album]',
      '[00:61.00]Invalid seconds',
      '[not-a-time]Invalid',
      '[00:02.00]',
      '[00:03.00][bad:value]Mixed malformed tags',
      '[00:04.00]Valid line',
    ].join('\n'));

    expect(result.lines.map(line => line.rawText)).toEqual(['Valid line']);
    expect(result.metadata).toEqual({});
  });

  it('orders out-of-order timestamps chronologically', () => {
    const result = parseLrc('[00:10.00]Later\n[00:02.00]Earlier');

    expect(result.lines.map(line => line.rawText)).toEqual(['Earlier', 'Later']);
    expect(result.lines[0].words[0].endMs).toBe(10_000);
  });
});
