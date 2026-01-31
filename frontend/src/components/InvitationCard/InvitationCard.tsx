import "./InvitationCard.css";

type InvitationCardProps = {
  invitation: {
    id: number;
    title: string;
    studentName: string;
    role: string;
  };
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
};

const InvitationCard = ({ invitation, onAccept, onReject }: InvitationCardProps) => {
  const { id, title, studentName, role } = invitation;

  return (
    <div className="invitation-card">
      <div className="invitation-card-title">{title}</div>
      <div className="invitation-card-info">
        <div className="invitation-card-info-row">
          <span className="invitation-card-label">Student:</span>
          <span>{studentName}</span>
        </div>
        <div className="invitation-card-info-row">
          <span className="invitation-card-label">Role:</span>
          <span className="invitation-card-role">{role}</span>
        </div>
      </div>
      <div className="invitation-card-actions">
        <button
          className="invitation-btn invitation-btn-reject"
          onClick={() => onReject?.(id)}
          title="Reject"
        >
          ✕
        </button>
        <button
          className="invitation-btn invitation-btn-accept"
          onClick={() => onAccept?.(id)}
          title="Accept"
        >
          ✓
        </button>
      </div>
    </div>
  );
};

export default InvitationCard;
