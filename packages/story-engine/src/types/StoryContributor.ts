export interface StoryContributor {
  contributorId: string;
  displayName: string;
  email?: string;
  commits: number;
  changedLines?: number;
  contributionPercentage: number;
  firstContributionAt: string;
  lastContributionAt: string;
  confidence: number;
}
