import { useNavigate } from "react-router-dom";
import "./ThesisCard.css";
import api from "../../api/client";

type ThesisStatus =
  | "UNDER_ASSIGNMENT"
  | "ACTIVE"
  | "UNDER_EXAMINATION"
  | "COMPLETED"
  | "CANCELLED";

const statusLabels: Record<ThesisStatus, string> = {
  UNDER_ASSIGNMENT: "Under Assignment",
  ACTIVE: "Active",
  UNDER_EXAMINATION: "Under Examination",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type ThesisCardProps = {
  thesis: {
    id: number;
    status?: ThesisStatus;
    officialAssignmentDate?: string;
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

const formatTimeSince = (dateString: string): string => {
  const assignmentDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - assignmentDate.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    const remainingMonths = Math.floor((days % 365) / 30);
    return remainingMonths > 0
      ? `${years}y ${remainingMonths}m`
      : `${years}y`;
  }
  if (months > 0) {
    const remainingDays = days % 30;
    return remainingDays > 0
      ? `${months}m ${remainingDays}d`
      : `${months}m`;
  }
  return `${days}d`;
};

const ThesisCard = ({ thesis }: ThesisCardProps) => {
  const navigate = useNavigate();
  const { topic, student, supervisor, status, officialAssignmentDate } = thesis;

  const studentName = student?.user
    ? `${student.user.firstName} ${student.user.lastName}`
    : "Unknown";
  const supervisorName = supervisor?.user
    ? `${supervisor.user.firstName} ${supervisor.user.lastName}`
    : "Unknown";

  const handleClick = () => {
    navigate(`/thesis/${thesis.id}`);
  };

  return (
    <div className="thesis-card" onClick={handleClick}>
      {status && (
        <div className="thesis-card-status-row">
          <span className={`thesis-card-status status-${status.toLowerCase().replace("_", "-")}`}>
            {statusLabels[status] || status}
          </span>
          {officialAssignmentDate && (
            <span className="thesis-card-time-elapsed">
              {formatTimeSince(officialAssignmentDate)} since assignment
            </span>
          )}
        </div>
      )}
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
            onClick={(e) => e.preventDefault()}
          >
            {topic.pdfFileName}
          </a>
        </div>
      )}
    </div>
  );
};

export default ThesisCard;
