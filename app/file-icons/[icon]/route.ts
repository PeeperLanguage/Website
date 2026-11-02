import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import manifest from 'material-icon-theme/dist/material-icons.json';

const definitions: Record<string, { iconPath: string }> = manifest.iconDefinitions;

export const dynamicParams = false;

/** The icon of every folder name, open and shut: all made at build time. */
export function generateStaticParams() {
  const icons = new Set(['folder', ...Object.values(manifest.folderNames)]);
  return [...icons].flatMap((icon) => [{ icon: `${icon}.svg` }, { icon: `${icon}-open.svg` }]);
}

export async function GET(_request: Request, { params }: { params: Promise<{ icon: string }> }) {
  const { icon } = await params;
  const { iconPath } = definitions[icon.replace(/\.svg$/, '')];
  const folder = join(process.cwd(), 'node_modules/material-icon-theme/dist');
  return new Response(await readFile(join(folder, iconPath)), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
