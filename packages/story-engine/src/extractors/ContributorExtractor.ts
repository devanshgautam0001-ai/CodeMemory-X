import { StoryContributor } from '../types/StoryContributor.js';

export class ContributorExtractor {
  public extractContributors(events: any[]): StoryContributor[] {
    const authorCommits = new Map<string, { count: number; first: string; last: string }>();

    for (const evt of events) {
      const author = evt.payload?.author ?? 'Devan';
      const timestamp = evt.timestamp ?? new Date().toISOString();

      if (!authorCommits.has(author)) {
        authorCommits.set(author, { count: 1, first: timestamp, last: timestamp });
      } else {
        const item = authorCommits.get(author)!;
        item.count += 1;
        if (timestamp < item.first) item.first = timestamp;
        if (timestamp > item.last) item.last = timestamp;
      }
    }

    const total = Array.from(authorCommits.values()).reduce((sum, a) => sum + a.count, 0);

    const contributors: StoryContributor[] = [];
    for (const [author, info] of authorCommits.entries()) {
      const pct = total > 0 ? Number(((info.count / total) * 100).toFixed(1)) : 100;
      contributors.push({
        contributorId: `contrib_${author.toLowerCase()}`,
        displayName: author,
        commits: info.count,
        contributionPercentage: pct,
        firstContributionAt: info.first,
        lastContributionAt: info.last,
        confidence: 0.95,
      });
    }

    return contributors.sort((a, b) => b.contributionPercentage - a.contributionPercentage);
  }
}
