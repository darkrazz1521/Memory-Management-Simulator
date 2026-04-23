function OutputPanel({ result }) {
  if (!result) return null;

  return (
    <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Output</h2>

      <p>Algorithm: {result.algorithm}</p>
      <p>Page Faults: {result.pageFaults}</p>

      <div className="mt-4">
        <h3 className="font-bold">Final Frames:</h3>
        <div className="flex gap-2 mt-2">
          {result.history[result.history.length - 1].frames.map((f, i) => (
            <div
              key={i}
              className="w-10 h-10 flex items-center justify-center bg-blue-500 rounded"
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OutputPanel;