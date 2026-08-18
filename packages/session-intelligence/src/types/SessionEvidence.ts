import { EvidenceCertainty } from './SessionTypes.js';

export interface SessionEvidence {
  id: string;
  certainty: EvidenceCertainty;
  source: string;
  description: string;
  observedAt: string;
  eventIds: string[];
}
