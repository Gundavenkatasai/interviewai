export interface IBulletPosition {
  paraIndex: number;
  section: string;
  roleIndex: number;
  bulletIndex: number;
  text: string;
  originalXml?: string;
}

export interface IDocxStructureMap {
  bullets: IBulletPosition[];
  headings: string[];
  boldVocabulary: string[];
  totalParagraphs: number;
  bulletCount: number;
}

export interface ISwapItem {
  id: string;
  section?: string;
  roleIndex?: number;
  bulletIndex?: number;
  originalText?: string;
  proposedText: string;
  approved?: boolean;
}

export interface ISwapResult {
  applied: { id: string }[];
  skipped: { id: string; reason: string }[];
  bulletCountBefore: number;
  bulletCountAfter: number;
  modifiedBuffer: Buffer;
}
