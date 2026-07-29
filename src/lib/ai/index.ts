import "server-only";

export interface AnonymousAnalysisInput {
  averages: { criterion: string; score: number }[];
  distributions: Record<string, number>;
  anonymousComments: string[];
}
export interface PedagogicalAnalysis { strengths: string[]; opportunities: string[]; recommendations: string[] }
export interface AnalysisProvider { analyze(input: AnonymousAnalysisInput): Promise<PedagogicalAnalysis> }

export async function generatePedagogicalAnalysis(input: AnonymousAnalysisInput, provider?: AnalysisProvider) {
  if(!provider)return null;
  return provider.analyze(input);
}
