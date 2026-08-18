import { ParserRegistry, ILanguageParser } from '@codememory/parser-sdk';

export class TreeSitterRegistry extends ParserRegistry {
  public registerTreeSitterParser(parser: ILanguageParser): void {
    this.register(parser);
  }
}
