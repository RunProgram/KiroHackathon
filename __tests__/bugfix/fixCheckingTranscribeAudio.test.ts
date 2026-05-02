/**
 * Fix Checking Test — Task 4.4
 *
 * Verifies that after the fix, the hardcoded mock transcript file
 * `lib/transcribeAudio.ts` no longer exists and that no file in the
 * `lib/` directory contains a `MOCK_TRANSCRIPT` constant.
 *
 * Expected: PASS on fixed code (file deleted).
 *
 * Validates: Requirements 2.3, 2.4
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Fix Checking — lib/transcribeAudio.ts does not exist after fix', () => {
  const libDir = path.resolve(__dirname, '../../lib');
  const transcribeAudioPath = path.resolve(libDir, 'transcribeAudio.ts');

  /**
   * **Validates: Requirements 2.3**
   *
   * The file `lib/transcribeAudio.ts` must not exist after the fix.
   */
  it('lib/transcribeAudio.ts does not exist', () => {
    expect(fs.existsSync(transcribeAudioPath)).toBe(false);
  });

  /**
   * **Validates: Requirements 2.3, 2.4**
   *
   * No file in the `lib/` directory should contain the string
   * `MOCK_TRANSCRIPT`, ensuring no hardcoded transcript responses
   * remain in the codebase.
   */
  it('no file in lib/ contains MOCK_TRANSCRIPT', () => {
    const libFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'));

    for (const file of libFiles) {
      const filePath = path.resolve(libDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('MOCK_TRANSCRIPT');
    }
  });
});
