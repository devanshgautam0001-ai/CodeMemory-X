export interface SessionSymbol {
  symbolId: string;
  name: string;
  filePath: string;
  touchCount: number;
  changeCount: number;
  relationshipCount: number;
  impactScore: number;
  confidence: number;
  isPrimaryFocus: boolean;
}
