export abstract class Entity<TProps> {
  readonly id: string;
  protected readonly props: TProps;

  constructor(id: string, props: TProps) {
    this.id = id;
    this.props = props;
  }

  equals(other?: Entity<TProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this.id === other.id;
  }
}
