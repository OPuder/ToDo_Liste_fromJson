export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<boolean>;
      getAutosavePath: () => Promise<string>;
      getGitLog: () => Promise<string>;
    };
  }
}