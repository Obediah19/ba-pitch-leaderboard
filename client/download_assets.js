import fs from 'fs';
import path from 'path';

const SOUNDS_DIR = path.resolve(process.cwd(), 'client', 'public', 'sounds');
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

const ASSETS = [
  {
    name: 'tick.wav',
    url: 'https://raw.githubusercontent.com/Calinou/kenney-ui-audio/master/addons/kenney_ui_audio/click1.wav',
    type: 'SFX: Countdown Tick (Kenney CC0)',
  },
  {
    name: 'lock.wav',
    url: 'https://raw.githubusercontent.com/Calinou/kenney-ui-audio/master/addons/kenney_ui_audio/switch10.wav',
    type: 'SFX: Answer Lock (Kenney CC0)',
  },
  {
    name: 'join.ogg',
    url: 'https://raw.githubusercontent.com/Boyquotes/kenney-digital-audio-for-godot/main/addons/kenney%20digital%20audio/two_tone_1.ogg',
    type: 'SFX: Player Joined Chime (Kenney CC0)',
  },
  {
    name: 'correct.ogg',
    url: 'https://raw.githubusercontent.com/Boyquotes/kenney-digital-audio-for-godot/main/addons/kenney%20digital%20audio/three_tone_1.ogg',
    type: 'SFX: Correct Answer Ding (Kenney CC0)',
  },
  {
    name: 'wrong.ogg',
    url: 'https://raw.githubusercontent.com/Boyquotes/kenney-digital-audio-for-godot/main/addons/kenney%20digital%20audio/zap_three_tone_down.ogg',
    type: 'SFX: Wrong Answer Buzz (Kenney CC0)',
  },
  {
    name: 'victory.ogg',
    url: 'https://raw.githubusercontent.com/Boyquotes/kenney-digital-audio-for-godot/main/addons/kenney%20digital%20audio/power_up_1.ogg',
    type: 'SFX: Victory Fanfare (Kenney CC0)',
  },
  {
    name: 'lobby_music.wav',
    url: 'https://raw.githubusercontent.com/aucaland/Kenney-jam-Audio/master/Kenney-HouseStart-Loop3.wav',
    type: 'Music: Upbeat Quiz Lobby Loop (Kenney CC0)',
  },
];

async function downloadAsset(asset) {
  const dest = path.join(SOUNDS_DIR, asset.name);
  console.log(`Downloading ${asset.name} from ${asset.url}...`);
  const res = await fetch(asset.url);
  if (!res.ok) {
    throw new Error(`Failed to download ${asset.name}: HTTP ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log(`✓ Successfully saved ${asset.name} (${buffer.length} bytes)`);
}

async function run() {
  const failed = [];
  for (const asset of ASSETS) {
    try {
      await downloadAsset(asset);
    } catch (err) {
      console.error(`✗ Error downloading ${asset.name}:`, err.message);
      failed.push({ asset, error: err.message });
    }
  }

  if (failed.length > 0) {
    console.error('Download failures detected:', failed);
    process.exit(1);
  } else {
    console.log('All audio assets downloaded successfully!');
  }
}

run();
