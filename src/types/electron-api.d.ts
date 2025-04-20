export {};

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string>;
      readFile: (path: string) => Promise<string>;
      getGitLog: () => Promise<string>;
    };
  }
}