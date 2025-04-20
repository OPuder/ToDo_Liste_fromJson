import { build } from 'esbuild';

async function buildAll() {
  try {

    await build({
      entryPoints: ['electron/main.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'electron/dist/main.cjs',
      external: ['electron'],
    });

    await build({
      entryPoints: ['electron/preload.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'electron/dist/preload.js',
      external: ['electron'],
    });
  } catch (error) {
    console.error('❌ Build-Fehler:', error);
    process.exit(1);
  }
}

buildAll();