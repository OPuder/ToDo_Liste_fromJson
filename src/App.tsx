import { useState, useEffect } from "react";

interface TaskEntry {
  title: string;
  description: string;
  estimated_hours: number;
  done: boolean;
}
interface Phase {
  phase: string;
  tasks: TaskEntry[];
}

const parseGitLog = (raw: string) =>
  raw
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\w+) - (.+) \((\d{4}-\d{2}-\d{2})/);
      return m ? { hash: m[1], message: m[2], date: m[3] } : null;
    })
    .filter(
      (e): e is { hash: string; message: string; date: string } => e !== null
    );

function App() {
  const [activeTab, setActiveTab] = useState<"json" | "git">("json");
  const [parsedContent, setParsedContent] = useState<Phase[]>([]);
  const [gitLog, setGitLog] = useState<
    { hash: string; message: string; date: string }[]
  >([]);
  const [gitError, setGitError] = useState<string | null>(null);
  const [autosavePath, setAutosavePath] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("collapsedStates");
    if (saved) {
      setCollapsed(JSON.parse(saved));
    } else {
      setCollapsed(parsedContent.map(() => true)); // beim ersten Mal: alles zu
    }
  }, [parsedContent]);

  useEffect(() => {
    if (collapsed.length > 0) {
      localStorage.setItem("collapsedStates", JSON.stringify(collapsed));
    }
  }, [collapsed]);

  // Autosave-Pfad vom Main-Prozess holen
  useEffect(() => {
    window.electronAPI.getAutosavePath().then(setAutosavePath);
  }, []);

  // Datei laden, wenn Pfad verfügbar
  useEffect(() => {
    if (!autosavePath) return;
    window.electronAPI.readFile(autosavePath).then((data) => {
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) setParsedContent(parsed);
      } catch (e) {
        console.error("❌ Fehler beim Laden von autosave.json", e);
      }
    });
  }, [autosavePath]);

  // const loadFile = async () => {
  //   const file = await window.electronAPI.openFile();
  //   const data = await window.electronAPI.readFile(file);
  //   localStorage.setItem("lastFilePath", file);
  //   try {
  //     const parsed = JSON.parse(data);
  //     if (Array.isArray(parsed)) {
  //       setParsedContent(parsed);
  //       await window.electronAPI.writeFile(
  //         autosavePath,
  //         JSON.stringify(parsed, null, 2)
  //       );
  //     }
  //     window.location.reload();
  //   } catch (e) {
  //     console.error("❌ JSON-Fehler:", e);
  //   }
  // };

  const loadGit = async () => {
    const raw = await window.electronAPI.getGitLog();
    if (raw.startsWith("⚠️")) {
      setGitError(raw);
      return;
    }
    setGitError(null);
    setGitLog(parseGitLog(raw));
  };

  const toggleTask = (pi: number, ti: number) => {
    setParsedContent((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[pi].tasks[ti].done = !updated[pi].tasks[ti].done;
      window.electronAPI.writeFile(
        autosavePath,
        JSON.stringify(updated, null, 2)
      );
      return updated;
    });
  };

  const toggleCollapse = (index: number) => {
    setCollapsed((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(parsedContent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todo-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    setFileName(file.name.replace(/\.json$/i, ""));
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // Hard Reset:
        setParsedContent([]); // <-- Sofort leer setzen (Force Render)
        setTimeout(() => {
          setParsedContent(json); // Dann neu setzen
          setCollapsed(json.map(() => true));
        }, 0);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        alert("Ungültige JSON-Datei");
      }
    };
    reader.readAsText(file);
  };

  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const totalTasks = parsedContent.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = parsedContent.reduce(
    (s, p) => s + p.tasks.filter((t) => t.done).length,
    0
  );
  const overallPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">🧪 ToDo Listen Tool</h1>
      {/* Drag & Drop JSON Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={preventDefaults}
        onDragEnter={preventDefaults}
        onDragLeave={preventDefaults}
        className="border-2 border-dashed border-gray-400 p-6 rounded text-center cursor-pointer hover:border-blue-500 transition-all"
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <p className="text-gray-600">
          📂 JSON-Datei hierher ziehen oder klicken zum Hochladen
        </p>
        <input
          id="fileInput"
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {/* Fortschrittsbalken */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
        {/* Innen‑Div: Breite wird dynamisch per JS gesetzt */}
        <div
          className="bg-green-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${overallPercent}%` }}
        />
      </div>
      <p className="text-sm text-center text-gray-600">
        Gesamtfortschritt: {doneTasks} / {totalTasks} ({overallPercent}%)
      </p>
      {/* Tabs */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "json" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("json")}
        >
          📂 ToDos
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "git" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("git")}
        >
          📜 Git Log
        </button>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={saveJson}
        >
          💾 JSON speichern
        </button>
      </div>

      {fileName && (
        <div className="text-center font-semibold text-gray-700 mt-4">
          📋 Aktuelle Liste: <span className="text-black">{fileName}</span>
        </div>
      )}

      {activeTab === "json" && (
        <div className="space-y-4 mt-6">
          {/* <button
          className="bg-yellow-400 text-black px-4 py-2 rounded"
          onClick={loadFile}
        >
          📂 JSON laden
        </button> */}

          {parsedContent.length > 0 &&
            parsedContent.map((phase, index) => {
              const total = phase.tasks.length;
              const done = phase.tasks.filter((task) => task.done).length;
              const percent = Math.round((done / total) * 100);
              const isCollapsed = collapsed[index];

              return (
                <div key={index} className="border rounded p-4 shadow bg-white">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCollapse(index)}
                  >
                    <h2 className="text-lg font-bold mb-2">📌 {phase.phase}</h2>
                    <span className="text-sm text-gray-500">
                      {isCollapsed ? "▶️" : "🔽"}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  {!isCollapsed && (
                    <ul className="space-y-2">
                      {phase.tasks.map((task, i) => (
                        <li
                          key={i}
                          onClick={() => toggleTask(index, i)}
                          className="flex flex-col bg-gray-100 p-3 rounded cursor-pointer hover:bg-gray-200 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={task.done}
                                readOnly
                                className="mr-2 pointer-events-none"
                              />
                              <span className="font-semibold">
                                {task.title}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              ⏱ {task.estimated_hours}h
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {task.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "git" && (
        <div className="space-y-4 mt-6">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={loadGit}
          >
            📜 Git Log anzeigen
          </button>

          {gitError && <div className="text-red-600 mt-2">{gitError}</div>}

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
                        <code className="bg-gray-200 px-1 rounded">
                          {entry.hash}
                        </code>
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
