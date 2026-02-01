import { useState, useRef } from "react";
import api from "../../api/client";
import "./ImportDataScreen.css";

type ImportResult = {
  success: boolean;
  message: string;
  details?: {
    studentsCreated?: number;
    professorsCreated?: number;
    errors?: string[];
  };
};

const ImportDataScreen = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        setResult({
          success: false,
          message: "Please select a valid JSON file",
        });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);

    try {
      const fileContent = await selectedFile.text();
      const jsonData = JSON.parse(fileContent);

      const response = await api.post("/import-users", jsonData);

      setResult({
        success: true,
        message: "Arxeio  submitted successfulyl",
        details: response.data,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to import data";
      setResult({
        success: false,
        message: errorMessage,
        details: error.response?.data?.details,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const exampleJson = `{
  "students": [
    {
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "password": "password123",
      "am": "1234567"
    }
  ],
  "professors": [
    {
      "email": "professor@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "username": "janesmith",
      "password": "password123"
    }
  ]
}`;

  return (
    <div className="import-screen">
      <div className="import-header">
        <h1>Import Data</h1>
      </div>

      <p className="import-description">
        Import students and professors from a JSON file. The file should contain
        personal information including email, name, username, and password.
      </p>

      <div className="import-card">
        <div
          className={`file-drop-zone ${selectedFile ? "has-file" : ""}`}
          onClick={handleDropZoneClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            hidden
          />
          {selectedFile ? (
            <>
              <p>File selected</p>
              <div className="file-name">{selectedFile.name}</div>
            </>
          ) : (
            <>
              <p>Click to select a JSON file</p>
              <small>Supported format: .json</small>
            </>
          )}
        </div>

        <div className="import-actions">
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Importing..." : "Import Data"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={!selectedFile && !result}
          >
            Clear
          </button>
        </div>

        {result && (
          <div className={`import-result ${result.success ? "success" : "error"}`}>
            <h4>{result.message}</h4>
            {result.details && (
              <ul>
                {result.details.studentsCreated !== undefined && (
                  <li>Students created: {result.details.studentsCreated}</li>
                )}
                {result.details.professorsCreated !== undefined && (
                  <li>Professors created: {result.details.professorsCreated}</li>
                )}
                {result.details.errors?.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="json-format">
          <h3>Expected JSON Format</h3>
          <pre>{exampleJson}</pre>
        </div>
      </div>
    </div>
  );
};

export default ImportDataScreen;
