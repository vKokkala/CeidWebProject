import "./ThesisCard.css";
import api from "../../api/client";

type ThesisCardProps = {
  thesis: {
    id: number;
    topic?: {
      id: number;
      title: string;
      description: string;
      pdfFileName?: string;
    };
    student?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    };
    professor?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    };
    supervisor?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    };
  };
};

const ThesisCard = ({ thesis }: ThesisCardProps) => {
  const { topic, student, professor, supervisor } = thesis;

  const studentName = student?.user
    ? `${student.user.firstName} ${student.user.lastName}`
    : "Unknown";
  const supervisorName = supervisor?.user
    ? `${supervisor.user.firstName} ${supervisor.user.lastName}`
    : "Unknown";

  return (
    <div className="thesis-card">
      <div className="thesis-card-title">{topic?.title || "No topic"}</div>
      <div className="thesis-card-description">
        {topic?.description || "No description"}
      </div>
      <div className="thesis-card-info">
        <div className="thesis-card-info-row">
          <span className="thesis-card-label">Student:</span>
          <span>{studentName}</span>
        </div>
        <div className="thesis-card-info-row">
          <span className="thesis-card-label">Supervisor:</span>
          <span>{supervisorName}</span>
        </div>
      </div>
      {topic?.pdfFileName && topic.id && (
        <div className="thesis-card-pdf">
          <a
            href={`${api.defaults.baseURL}/topic/${topic.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="thesis-card-pdf-link"
          >
            {topic.pdfFileName}
          </a>
        </div>
      )}
    </div>
  );
};

export default ThesisCard;
