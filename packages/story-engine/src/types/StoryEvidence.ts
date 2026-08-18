import { EvidenceSource, EvidenceCertainty } from './StoryTypes.js';

export interface StoryEvidence {
  id: string;
  source: EvidenceSource;
  eventId?: string;
  timestamp?: string;
  description: string;
  certainty: EvidenceCertainty;
  confidence: number;
}
