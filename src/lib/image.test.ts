import { afterEach, describe, expect, it, vi } from 'vitest';
import { downscalePhoto } from './image';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('photo downscale', () => {
  it('limits the longest side to 2560 and encodes JPEG at 0.9', async () => {
    const resized = new Blob(['jpeg'], { type: 'image/jpeg' });
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback) => callback(resized));
    const canvas = {
      width: 0,
      height: 0,
      toBlob,
      getContext: () => ({ fillRect: vi.fn(), drawImage }),
    };
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 4000;
        naturalHeight = 3000;
        src = '';
        decode = async () => {};
      },
    );
    vi.stubGlobal('document', { createElement: () => canvas });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:original');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    expect(await downscalePhoto(new Blob(['original']))).toBe(resized);
    expect([canvas.width, canvas.height]).toEqual([2560, 1920]);
    expect(toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.9,
    );
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      2560,
      1920,
    );
    expect(revoke).toHaveBeenCalledWith('blob:original');
  });

  it('releases the object URL if decoding fails', async () => {
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        decode = async () => {
          throw new Error('decode failed');
        };
      },
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:broken');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    await expect(downscalePhoto(new Blob(['broken']))).rejects.toThrow(
      'decode failed',
    );
    expect(revoke).toHaveBeenCalledWith('blob:broken');
  });
});
