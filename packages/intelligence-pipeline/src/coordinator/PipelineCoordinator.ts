import { WorkspaceEvent, IWorkspaceWatcher } from '@codememory/workspace-watcher';
import { GitService } from '@codememory/git-engine';
import { TreeSitterFactory } from '@codememory/tree-sitter-engine';
import { SymbolGraphBuilder } from '@codememory/symbol-graph';
import { IEventBus } from '@codememory/event-bus';
import { Result, ok, fail } from '@codememory/shared';
import { PipelineContext } from '../context/PipelineContext.js';
import { PipelineExecutor } from '../executor/PipelineExecutor.js';
import { IntelligenceResult } from '../types/PipelineResult.js';
import { DetectWorkspaceEventStage } from '../stages/DetectWorkspaceEventStage.js';
import { ResolveRepositoryStage } from '../stages/ResolveRepositoryStage.js';
import { DetermineChangedFilesStage } from '../stages/DetermineChangedFilesStage.js';
import { SelectParserStage } from '../stages/SelectParserStage.js';
import { ParseFilesStage } from '../stages/ParseFilesStage.js';
import { BuildSymbolGraphStage } from '../stages/BuildSymbolGraphStage.js';
import { PublishPipelineEventsStage } from '../stages/PublishPipelineEventsStage.js';
import { ILogger } from '@codememory/logging';

export class PipelineCoordinator {
  private parserFactory: TreeSitterFactory;
  private graphBuilder: SymbolGraphBuilder;

  constructor(
    private readonly workspaceWatcher?: IWorkspaceWatcher,
    private readonly gitService?: GitService,
    private readonly eventBus?: IEventBus,
    private readonly logger?: ILogger
  ) {
    this.parserFactory = new TreeSitterFactory();
    this.graphBuilder = new SymbolGraphBuilder(this.logger);
  }

  public async processEvent(event: WorkspaceEvent): Promise<Result<IntelligenceResult>> {
    const context = new PipelineContext({
      event,
      workspacePath: event.workspace,
    });

    const stages = [
      new DetectWorkspaceEventStage(),
      new ResolveRepositoryStage(this.gitService),
      new DetermineChangedFilesStage(this.gitService),
      new SelectParserStage(this.parserFactory),
      new ParseFilesStage(),
      new BuildSymbolGraphStage(this.graphBuilder),
      new PublishPipelineEventsStage(this.eventBus),
    ];

    const executor = new PipelineExecutor(stages, this.logger);
    return executor.run(context);
  }

  public listenAndCoordinate(): () => void {
    if (!this.workspaceWatcher) {
      throw new Error('WorkspaceWatcher not provided to PipelineCoordinator');
    }

    return this.workspaceWatcher.onEvent(async (evt) => {
      this.logger?.info(`Coordinator received WorkspaceEvent ${evt.eventType}`);
      await this.processEvent(evt);
    });
  }
}
