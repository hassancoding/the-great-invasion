import { ARIN_HALCYON_OBJECTIVES, type ObjectiveDefinition, type ObjectiveRequirement } from '../data/objectives';

export type ObjectiveEvent =
  | { type: 'wave-cleared'; waveIndex: number }
  | { type: 'enemy-defeated'; enemyKind: string }
  | { type: 'all-waves-cleared' }
  | { type: 'well-progress'; progress: number }
  | { type: 'well-stabilized' };

export type ObjectiveStatus = 'active' | 'complete' | 'failed';

export class ObjectiveProgression {
  private readonly clearedWaves = new Set<number>();
  private readonly defeatedEnemies = new Set<string>();
  private currentIndex = 0;
  private allWavesCleared = false;
  private wellProgress = 0;
  private failedObjective?: ObjectiveDefinition;
  private status: ObjectiveStatus = 'active';

  private readonly totalWaves: number;

  constructor(totalWaves: number) {
    this.totalWaves = Math.max(1, totalWaves);
  }

  get currentObjective() {
    return ARIN_HALCYON_OBJECTIVES[this.currentIndex];
  }

  get currentObjectiveIndex() {
    return this.currentIndex;
  }

  get objectiveCount() {
    return ARIN_HALCYON_OBJECTIVES.length;
  }

  get currentProgressLabel() {
    const requirement = this.currentObjective?.requirement;
    if (!requirement) return this.status === 'complete' ? 'COMPLETE' : 'FAILED';

    if (requirement.type === 'waves-cleared') {
      const cleared = requirement.waveIndexes.filter((index) => this.clearedWaves.has(index)).length;
      return `${cleared}/${requirement.waveIndexes.length} waves`;
    }
    if (requirement.type === 'enemy-defeated') {
      return this.defeatedEnemies.has(requirement.enemyKind) ? 'DEFEATED' : 'PENDING';
    }
    if (requirement.type === 'all-waves-cleared') {
      return `${this.clearedWaves.size}/${this.totalWaves} waves`;
    }
    return `${Math.floor(this.wellProgress * 100)}%`;
  }

  get currentStatus() {
    return this.status;
  }

  get failureObjective() {
    return this.failedObjective;
  }

  record(event: ObjectiveEvent): ObjectiveDefinition[] {
    if (this.status !== 'active') return [];

    if (event.type === 'wave-cleared') this.clearedWaves.add(event.waveIndex);
    else if (event.type === 'enemy-defeated') this.defeatedEnemies.add(event.enemyKind);
    else if (event.type === 'all-waves-cleared') this.allWavesCleared = true;
    else if (event.type === 'well-progress') this.wellProgress = Math.max(0, Math.min(1, event.progress));
    else if (event.type === 'well-stabilized') this.wellProgress = 1;

    const completed: ObjectiveDefinition[] = [];
    while (this.currentObjective && this.isRequirementMet(this.currentObjective.requirement)) {
      completed.push(this.currentObjective);
      this.currentIndex++;
    }
    if (!this.currentObjective) this.status = 'complete';
    return completed;
  }

  fail() {
    if (this.status !== 'active') return this.failedObjective;
    this.failedObjective = this.currentObjective;
    this.status = 'failed';
    return this.failedObjective;
  }

  private isRequirementMet(requirement: ObjectiveRequirement) {
    if (requirement.type === 'waves-cleared') {
      return requirement.waveIndexes.every((index) => this.clearedWaves.has(index));
    }
    if (requirement.type === 'enemy-defeated') return this.defeatedEnemies.has(requirement.enemyKind);
    if (requirement.type === 'all-waves-cleared') return this.allWavesCleared;
    return this.wellProgress >= 1;
  }
}