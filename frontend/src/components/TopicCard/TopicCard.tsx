import { useState } from "react";
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
  onSaved?: () => void;
};

const TopicCard = ({ topic, isNew, professorId, onSaved }: TopicCardProps) => {
  const [isEditing, setIsEditing] = useState(!!isNew);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add professorId to formData if provided
    if (professorId) {
      formData.append("professorId", String(professorId));
    }

    if (isNew) {
            console.log('calling post')

      await api.post("/topic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else if (topic.id) {
      console.log('calling Patch')
      await api.patch(`/topic/${topic.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    setIsEditing(false);
    setSelectedFileName(null);
    onSaved?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFileName(file?.name || null);
  };

  return (
    <div className={"card"}>
      {isEditing || isNew ? (
        <form onSubmit={handleSubmit}>
          <button type="submit" className="card-edit-btn">
            ✔
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
