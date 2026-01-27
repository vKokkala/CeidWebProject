import { useRef, useState } from "react";
import "./TopicCard.css";

type TopicCardProps = {
  topic: {
    title: string;
    description: string;
    extendedDescriptionPdf?: string;
  };
  isNew?: boolean;
  professorId?: number;
};

const TopicCard = ({ topic, isNew }: TopicCardProps) => {
  const [isEditing, setIsEditing] = useState(!!isNew);
  const [title, setTitle] = useState(topic.title);
  const [description, setDescription] = useState(topic.description);
  const [pdfName, setPdfName] = useState(topic.extendedDescriptionPdf || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // TODO: call API to save/create
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfName(file.name);
  };

  return (
    <div className={`card ${isNew ? "card-new" : ""}`}>
      <button
        className="card-edit-btn"
        onClick={isEditing ? handleSave : () => setIsEditing(true)}
      >
        {isEditing ? "✔" : "✏️"}
      </button>

      {isEditing ? (
        <>
          <input
            className="card-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title"
          />
          <textarea
            className="card-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Topic description"
          />
        </>
      ) : (
        <>
          <div className="card-title">{title}</div>
          <div className="card-description">{description}</div>
        </>
      )}

      <div className="card-pdf">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          hidden
        />
        {pdfName ? (
          <span
            className="card-pdf-name"
            onClick={() => fileInputRef.current?.click()}
          >
            🔗 {pdfName}{" "}
            <span className="card-pdf-replace">
              Replace extensive description file
            </span>
          </span>
        ) : (
          <button
            className="card-pdf-select"
            onClick={() => fileInputRef.current?.click()}
          >
            Add Extensive description file 🔗
          </button>
        )}
      </div>
    </div>
  );
};

export default TopicCard;
