export interface Recommendation {
  العبارة: string;   // anchor — verbatim substring from the source text
  الخطأ: string;    // error description
  التصحيح: string;  // corrected replacement, same span as anchor
  // Added by consistency-check post-processing, never sent to the model
  _flagReason?: "leaked_uncorrected_span";
  _conflictsWith?: string;
}

export interface ChunkResponse {
  التوصيات: Recommendation[];
}

export interface ChunkResult {
  clean: Recommendation[];
  flagged: Recommendation[];
  stats: ConsistencyStats;
}

export interface ConsistencyStats {
  total: number;
  noOp: number;
  leaked: number;
  malformed: number;
  clean: number;
}

export interface MergedResult {
  clean: Recommendation[];
  flagged: Recommendation[];
  stats: ConsistencyStats;
}
