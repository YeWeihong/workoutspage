const REPOSITORY = 'YeWeihong/workoutspage';
const BRANCH = 'master';
const OVERRIDES_PATH = 'src/static/activity-name-overrides.json';
const CONTENTS_API = `https://api.github.com/repos/${REPOSITORY}/contents/${OVERRIDES_PATH}`;

interface GitHubFileResponse {
  content: string;
  sha: string;
}

interface GitHubUpdateResponse {
  commit?: {
    html_url?: string;
  };
}

function decodeBase64Json(content: string): Record<string, string> {
  const binary = atob(content.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, string>;
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function githubError(response: Response): Promise<Error> {
  let message = `${response.status} ${response.statusText}`;
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) message = payload.message;
  } catch {
    // Keep the HTTP status when GitHub does not return JSON.
  }
  return new Error(message);
}

export async function commitActivityName(
  runId: number,
  name: string,
  token: string
): Promise<string | null> {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const currentResponse = await fetch(
    `${CONTENTS_API}?ref=${encodeURIComponent(BRANCH)}`,
    { headers }
  );
  if (!currentResponse.ok) throw await githubError(currentResponse);

  const current = (await currentResponse.json()) as GitHubFileResponse;
  const overrides = decodeBase64Json(current.content);
  overrides[String(runId)] = name.trim();

  const updateResponse = await fetch(CONTENTS_API, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Rename activity ${runId}`,
      content: encodeBase64(`${JSON.stringify(overrides, null, 2)}\n`),
      sha: current.sha,
      branch: BRANCH,
    }),
  });
  if (!updateResponse.ok) throw await githubError(updateResponse);

  const result = (await updateResponse.json()) as GitHubUpdateResponse;
  return result.commit?.html_url ?? null;
}
