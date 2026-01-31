import { useEffect, useState } from "react";
import "./TopicCard.css";
import api from "../../api/client";

type TopicCardProps = {
  topic: {
    id?: number;
    title: string;
    description: string;
    pdfFileName?: string;
  };
  isNew?: boolean;
  professorId?: number;
  onSave?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
};

const TopicCard = ({
  topic,
  isNew,
  professorId,
  onSave,
  isSelectable,
  isSelected,
  onSelect,
}: TopicCardProps) => {
  const [isEditing, setIsEditing] = useState(!!isNew);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clearr status after 3 seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus(null);
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveStatus(null);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    if (professorId) {
      formData.append("professorId", String(professorId));
    }

    try {
      if (isNew) {
        await api.post("/topic", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (topic.id) {
        await api.patch(`/topic/${topic.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSaveStatus("success");
      setIsEditing(false);
      setSelectedFileName(null);
      onSave?.();
    } catch (error: any) {
      setSaveStatus("error");
      setErrorMessage(error.response?.data?.error || "Failed to save topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file?.name || null);
  };

  const handleCardClick = () => {
    if (isSelectable && onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={`card ${saveStatus === "success" ? "card-success" : ""} ${saveStatus === "error" ? "card-error" : ""} ${isSelectable ? "card-selectable" : ""} ${isSelected ? "card-selected" : ""}`}
      onClick={handleCardClick}
    >
      {saveStatus === "success" && (
        <div className="card-status card-status-success">
          Saved successfully!
        </div>
      )}
      {saveStatus === "error" && (
        <div className="card-status card-status-error">{errorMessage}</div>
      )}
      {isEditing || isNew ? (
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            className="card-edit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : "✔"}
          </button>
          <input
            className="card-title-input"
            name="title"
            defaultValue={topic.title}
            placeholder="Topic title"
            required
          />
          <textarea
            className="card-description-input"
            name="description"
            defaultValue={topic.description}
            placeholder="Topic description"
            required
          />
          <div className="card-pdf">
            <label className="card-pdf-select">
              {selectedFileName
                ? `📄 ${selectedFileName}`
                : topic.pdfFileName
                  ? `🔗 ${topic.pdfFileName} (Replace)`
                  : "Add Extensive description file 🔗"}
              <input
                type="file"
                name="pdfFile"
                accept=".pdf"
                onChange={handleFileChange}
                hidden
              />
            </label>
          </div>
        </form>
      ) : (
        <>
          <button className="card-edit-btn" onClick={() => setIsEditing(true)}>
            ✏️
          </button>
          <div className="card-title">{topic.title}</div>
          <div className="card-description">{topic.description}</div>
          {topic.pdfFileName && topic.id && (
            <div className="card-pdf">
              <a
                href={`${api.defaults.baseURL}/topic/${topic.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="card-pdf-name"
              >
                🔗 {topic.pdfFileName}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopicCard;
