import { useState } from "react";
import "./TopicCard.css";
import api from "../../api/client";

type TopicCardProps = {
  topic: {
    id?: number;
    title: string;
    description: string;
    extendedDescriptionPdf?: string;
  };
  isNew?: boolean;
  professorId?: number;
  onSaved?: () => void;
};

const TopicCard = ({ topic, isNew, professorId, onSaved }: TopicCardProps) => {
  const [isEditing, setIsEditing] = useState(!!isNew);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      ...(professorId && { professorId }),
    };

    if (isNew) {
      await api.post("/topic", data);
    } else if (topic.id) {
      await api.patch(`/topic/${topic.id}`, data);
    }

    setIsEditing(false);
    onSaved?.();
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
              {topic.extendedDescriptionPdf
                ? `🔗 ${topic.extendedDescriptionPdf} (Replace)`
                : "Add Extensive description file 🔗"}
              <input
                type="file"
                name="extendedDescriptionPdf"
                accept=".pdf"
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
          {topic.extendedDescriptionPdf && (
            <div className="card-pdf">
              <span className="card-pdf-name">
                🔗 {topic.extendedDescriptionPdf}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopicCard;
