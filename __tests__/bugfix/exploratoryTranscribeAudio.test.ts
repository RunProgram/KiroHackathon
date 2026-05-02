/**
 * Exploratory Bug Condition Test — Task 1.3
 *
 * Verifies that `transcribeAudio` returns a hardcoded mock transcript
 * for any non-empty audio URI on the current (unfixed) code.
 * This confirms Bug 2 exists: the file contains a MOCK_TRANSCRIPT constant
 * that always returns a pre-written bank scam transcript.
 *
 * Expected: PASS on unfixed code (bug confirmed), FAIL after fix
 * (when lib/transcribeAudio.ts is deleted).
 *
 * Validates: Requirements 1.3, 1.4, 2.3, 2.4
 */

import { transcribeAudio } from '../../lib/transcribeAudio';

describe('Exploratory Bug Condition — transcribeAudio returns hardcoded mock transcript', () => {
  it('returns the hardcoded mock transcript for a valid audio URI', async () => {
    const result = await transcribeAudio('file:///audio/recording.m4a');

    // The result should be a non-empty string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // BUG CONDITION: The returned string contains hardcoded bank scam content
    expect(result).toContain('bank');
    expect(result).toContain('suspicious activity');
    expect(result).toContain('account number');
    expect(result).toContain('verification code');
  });

  it('returns the SAME hardcoded string for different URIs (proving it is not real transcription)', async () => {
    const result1 = await transcribeAudio('file:///audio/recording1.m4a');
    const result2 = await transcribeAudio('file:///audio/totally-different-file.wav');
    const result3 = await transcribeAudio('https://example.com/some-other-audio.mp3');

    // BUG CONDITION: All three calls return the exact same string,
    // proving the output is hardcoded and not based on actual audio content
    expect(result1).toBe(result2);
    expect(result2).toBe(result3);
  });

  it('returns an empty string for an empty URI input', async () => {
    const result = await transcribeAudio('');

    // Empty URI should return empty string (this is the guard clause behavior)
    expect(result).toBe('');
  });
});
