import { Job } from 'src/common/entities/job.entity';

export type SearchResult = {
  job: Job;
  score: number;
};

type BM25Options = {
  k1?: number;
  b?: number;

  fieldWeights?: {
    description?: number;
    requirements?: number;
    tags?: number;
  };
};

function tokenizer(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

type DocumentEntry = {
  job: Job;
  termFreq: Map<string, number>;
  length: number;
};

type InvertedDocumentEntry = {
  df: number;
};

export class BM25 {
  private docs: DocumentEntry[] = [];
  private invertedIndex = new Map<string, InvertedDocumentEntry>();
  private avgDocLength = 0;
  private k1: number;
  private b: number;
  private fieldWeights: Required<BM25Options['fieldWeights']>;

  constructor(jobs: Job[], options: BM25Options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
    this.fieldWeights = {
      description: options.fieldWeights?.description ?? 1,
      requirements: options.fieldWeights?.requirements ?? 1.5,
      tags: options.fieldWeights?.tags ?? 2,
    };

    this.build(jobs);
  }

  private build(jobs: Job[]) {
    let totalLength = 0;

    for (const job of jobs) {
      const termFreq = new Map<string, number>();

      const add = (text: string, weight: number) => {
        for (const token of tokenizer(text)) {
          termFreq.set(token, (termFreq.get(token) ?? 0) + weight);
        }
      };

      add(job.description, this.fieldWeights!.description);

      for (const r of job.requirements) add(r, this.fieldWeights!.requirements);
      for (const t of job.tags) add(t, this.fieldWeights!.tags);

      const length = [...termFreq.values()].reduce((a, b) => a + b, 0);
      totalLength += length;

      this.docs.push({
        job,
        termFreq,
        length,
      });
    }

    this.avgDocLength = this.docs.length ? totalLength / this.docs.length : 1;

    for (const doc of this.docs) {
      for (const term of doc.termFreq.keys()) {
        const entry = this.invertedIndex.get(term) ?? { df: 0 };
        entry.df += 1;
        this.invertedIndex.set(term, entry);
      }
    }
  }

  private idf(term: string): number {
    const N = this.docs.length;
    const df = this.invertedIndex.get(term)?.df ?? 0;
    if (df === 0) return 0;

    // NOTE: Robertson-Sparck Jones IDF (with smoothing to avoid negatives)
    return Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }

  private scoreDocument(doc: DocumentEntry, queryTerms: string[]): number {
    const { k1, b, avgDocLength } = this;
    let score = 0;

    for (const term of queryTerms) {
      const idf = this.idf(term);
      if (idf === 0) continue;

      const tf = doc.termFreq.get(term) ?? 0;

      // NOTE: This is the second side of the BM25 Formula.
      const normalizedTF =
        (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc.length / avgDocLength)));

      score += idf * normalizedTF;
    }

    return score;
  }

  public query(query: string, topK = 10) {
    const queryTerms = tokenizer(query);

    if (!queryTerms.length) return [];

    const results: SearchResult[] = this.docs
      .map((doc) => ({
        job: doc.job,
        score: this.scoreDocument(doc, queryTerms),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }
}
