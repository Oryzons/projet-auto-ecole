import { DocumentStatus, DocumentType } from '@/lib/db/client';

import {
  ALL_DOCUMENT_TYPES,
  OPTIONAL_DOCUMENTS,
  REQUIRED_DOCUMENTS,
} from '@/lib/constants';

type DocumentLike = {
  type: DocumentType | string;
  status: DocumentStatus | string;
};

export function computeDossierProgress(documents: DocumentLike[]) {
  const approvedRequired = REQUIRED_DOCUMENTS.filter((type) =>
    documents.some(
      (doc) => doc.type === type && doc.status === DocumentStatus.APPROVED,
    ),
  ).length;

  return Math.round((approvedRequired / REQUIRED_DOCUMENTS.length) * 100);
}

export function getDocumentEntry<T extends DocumentLike>(
  documents: T[],
  type: DocumentType,
): T | null {
  return documents.find((doc) => doc.type === type) ?? null;
}

export function countDocumentsByStatus(documents: DocumentLike[]) {
  let uploaded = 0;
  let approved = 0;
  let missing = 0;

  for (const type of ALL_DOCUMENT_TYPES) {
    const doc = getDocumentEntry(documents, type);
    if (!doc) {
      missing += 1;
      continue;
    }
    uploaded += 1;
    if (doc.status === DocumentStatus.APPROVED) approved += 1;
  }

  return {
    total: ALL_DOCUMENT_TYPES.length,
    required: REQUIRED_DOCUMENTS.length,
    optional: OPTIONAL_DOCUMENTS.length,
    uploaded,
    approved,
    missing,
  };
}
