import { useState, type ChangeEvent } from "react";

const TopicsScreen = () => {
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  return (
    <>
      <div>Topics Screen</div>
      <button
        onClick={() => {
          setShowTopicForm((prev) => !prev);
        }}
      >
        Create New Topic
      </button>
      {showTopicForm && (
        <form>
          <label>Title</label>
          <input />

          <label>Description</label>
          <input />

          <label>Upload PDF</label>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          {pdfFile && <span>{pdfFile.name}</span>}

          <label></label>
          <input />
        </form>
      )}
    </>
  );
};

export default TopicsScreen;
