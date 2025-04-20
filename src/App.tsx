import { useState } from "react";

console.log("✅ window.electronAPI:", window.electronAPI);
const parseGitLog = (raw: string): { hash: string; message: string; date: string }[] => {
  return raw.split('\n')
    .map(line => {
      const match = line.match(/^(\w+) - (.+) \((\d{4}-\d{2}-\d{2})/);
      if (!match) return null;
      return {
        hash: match[1],
        message: match[2],
        date: match[3],
      };
    })
    .filter((entry): entry is { hash: string; message: string; date: string } => entry !== null);
};

function App() {
  const [activeTab, setActiveTab] = useState<'json' | 'git'>('json');
  const [content, setContent] = useState("");
  const [parsedContent, setParsedContent] = useState<any[]>([]);
  const [gitLog, setGitLog] = useState<{ hash: string; message: string; date: string }[]>([]);
  const [gitError, setGitError] = useState<string | null>(null);

  const loadFile = async () => {
    const path = await window.electronAPI.openFile();
    const data = await window.electronAPI.readFile(path);
    setContent(data);

    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        setParsedContent(parsed);
      }
    } catch (e) {
      console.error("❌ JSON-Fehler:", e);
    }
  };

  const loadGit = async () => {
    const raw = await window.electronAPI.getGitLog();
    if (raw.startsWith("⚠️")) {
      setGitError(raw);
      return;
    }
    setGitError(null);
    const parsed = parseGitLog(raw);
    setGitLog(parsed);
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">🧪 ToDo Listen Tool</h1>

      <div className="flex justify-center gap-4 mt-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'json' ? 'bg-yellow-400 text-black' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('json')}
        >📂 ToDos</button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'git' ? 'bg-yellow-400 text-black' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('git')}
        >📜 Git Log</button>
      </div>

      {activeTab === 'json' && (
        <div className="space-y-4 mt-6">
          <button
            className="bg-yellow-400 text-black px-4 py-2 rounded"
            onClick={loadFile}
          >📂 JSON laden</button>

          {parsedContent.length > 0 && parsedContent.map((phase, index) => {
            const total = phase.tasks.length;
            const done = phase.tasks.filter((t: any) => t.done).length;
            const percent = Math.round((done / total) * 100);
            return (
              <div key={index} className="border rounded p-4 shadow bg-white">
                <h2 className="text-lg font-bold mb-2">📌 {phase.phase}</h2>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>

                <ul className="space-y-2">
                  {phase.tasks.map((task: any, i: number) => (
                    <li key={i} className="flex flex-col bg-gray-100 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <label className="font-semibold">
                          <input type="checkbox" checked={task.done} readOnly className="mr-2" />
                          {task.title}
                        </label>
                        <span className="text-sm text-gray-500">⏱ {task.estimated_hours}h</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'git' && (
        <div className="space-y-4 mt-6">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={loadGit}
          >📜 Git Log anzeigen</button>

          {gitError && (
            <div className="text-red-600 mt-2">{gitError}</div>
          )}

          {gitLog.length > 0 && (
            <div className="overflow-x-auto border rounded-lg mt-4">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2">Commit</th>
                    <th className="px-4 py-2">Nachricht</th>
                    <th className="px-4 py-2">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {gitLog.map((entry, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        <code className="bg-gray-200 px-1 rounded">{entry.hash}</code>
                      </td>
                      <td className="px-4 py-2">{entry.message}</td>
                      <td className="px-4 py-2">{entry.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;