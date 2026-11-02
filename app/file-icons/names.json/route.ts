import manifest from 'material-icon-theme/dist/material-icons.json';

export const dynamic = 'force-static';

/** Which icon each folder name has. The page fetches it whole, so no folder name leaves it. */
export function GET() {
  return Response.json(manifest.folderNames);
}
