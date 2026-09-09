import { createAvatar } from '@dicebear/core';
import { bottts, adventurer } from '@dicebear/collection';

export function getAvatarDataUri(seed: string, style: 'bottts' | 'adventurer' = 'bottts'): string {
  const avatar =
    style === 'adventurer'
      ? createAvatar(adventurer, { seed: seed || 'player-1', radius: 50 })
      : createAvatar(bottts, { seed: seed || 'player-1', radius: 50 });

  return avatar.toDataUri();
}

export function getRandomAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 9);
}
