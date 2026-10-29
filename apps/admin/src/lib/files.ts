import { UTApi } from "uploadthing/server";

let utapi: UTApi | null | undefined;

function getUtApi() {
  if (utapi !== undefined) return utapi;
  utapi = process.env.UPLOADTHING_TOKEN ? new UTApi() : null;
  return utapi;
}

/**
 * Documents d'identité en accès privé ? Nécessite d'activer l'option
 * « Allow overriding ACL » dans le tableau de bord Uploadthing.
 */
export const PRIVATE_DOCUMENTS = process.env.UPLOADTHING_PRIVATE_DOCUMENTS === "true";

/** Extrait la clé Uploadthing d'une URL de fichier (utfs.io/f/<clé> ou <app>.ufs.sh/f/<clé>). */
export function fileKeyFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/f\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]!) : null;
  } catch {
    return null;
  }
}

/** URL utilisable côté serveur pour lire un fichier (signée s'il est privé). */
export async function resolveFileUrl(file: { fileUrl: string; fileKey?: string | null }) {
  const key = file.fileKey ?? fileKeyFromUrl(file.fileUrl);
  const api = getUtApi();
  if (PRIVATE_DOCUMENTS && key && api) {
    const { ufsUrl } = await api.generateSignedURL(key, { expiresIn: 60 });
    return ufsUrl;
  }
  return file.fileUrl;
}

/** Supprime des fichiers chez Uploadthing (RGPD). Ne lève jamais d'erreur. */
export async function deleteStoredFiles(files: { fileUrl: string; fileKey?: string | null }[]) {
  const api = getUtApi();
  if (!api) return;
  const keys = files
    .map((file) => file.fileKey ?? fileKeyFromUrl(file.fileUrl))
    .filter((key): key is string => Boolean(key));
  if (keys.length === 0) return;
  try {
    await api.deleteFiles(keys);
  } catch (error) {
    console.error("Suppression Uploadthing impossible:", error);
  }
}
