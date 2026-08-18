import Module from 'node:module';
import mockVsCode from '../__mocks__/vscode.js';

const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'vscode') {
    return mockVsCode;
  }
  return originalRequire.apply(this, arguments);
};
