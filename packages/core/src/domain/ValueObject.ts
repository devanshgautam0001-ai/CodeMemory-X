export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  constructor(props: TProps) {
    this.props = Object.freeze(props);
  }

  equals(vo?: ValueObject<TProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
