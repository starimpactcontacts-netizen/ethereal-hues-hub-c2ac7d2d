import chainsaw from '@/assets/scenepacks/chainsaw-man.webp';
import deathnote from '@/assets/scenepacks/death-note.webp';
import arcane from '@/assets/scenepacks/arcane.webp';
import avatar from '@/assets/scenepacks/avatar.webp';
import invincible from '@/assets/scenepacks/invincible.webp';
import jjk from '@/assets/scenepacks/jujutsu-kaisen.webp';

export interface Scenepack {
  id: string;
  name: string;
  poster: string;
  packCount: number;
}

export const SCENEPACKS: Scenepack[] = [
  { id: 'chainsaw-man',   name: 'Chainsaw Man',   poster: chainsaw,    packCount: 12 },
  { id: 'death-note',     name: 'Death Note',     poster: deathnote,   packCount: 8  },
  { id: 'arcane',         name: 'Arcane',         poster: arcane,      packCount: 15 },
  { id: 'avatar',         name: 'Avatar',         poster: avatar,      packCount: 6  },
  { id: 'invincible',     name: 'Invincible',     poster: invincible,  packCount: 9  },
  { id: 'jujutsu-kaisen', name: 'Jujutsu Kaisen', poster: jjk,         packCount: 14 },
];
