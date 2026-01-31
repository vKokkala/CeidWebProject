import { useState } from "react";
import InvitationCard from "../../components/InvitationCard/InvitationCard";
import "./AssignmentsScreen.css";

const mockInvitations = [
  {
    id: 1,
    title: "Machine Learning in Healthcare Applications",
    studentName: "Maria Papadopoulou",
    role: "Supervisor",
  },
  {
    id: 2,
    title: "Blockchain-based Voting Systems",
    studentName: "Nikos Georgiou",
    role: "Committee Member",
  },
  {
    id: 3,
    title: "Natural Language Processing for Greek Text",
    studentName: "Elena Konstantinou",
    role: "Committee Member",
  },
  {
    id: 4,
    title: "Cloud Computing Security Mechanisms",
    studentName: "Dimitris Alexiou",
    role: "Supervisor",
  },
  {
    id: 5,
    title: "IoT Smart Home Automation",
    studentName: "Sofia Vasileiou",
    role: "Committee Member",
  },
];

const AssignmentsScreen = () => {
  const [invitations, setInvitations] = useState(mockInvitations);

  const handleAccept = (id: number) => {
    console.log("Accept invitation:", id);
    // TODO: Implement accept functionality
  };

  const handleReject = (id: number) => {
    console.log("Reject invitation:", id);
    // TODO: Implement reject functionality
  };

  return (
    <div className="assignmentsScreen">
      <header className="assignmentsHeader">
        <h1>Invitations</h1>
      </header>

      <p className="assignmentsDescription">
        Pending invitations to participate in thesis committees.
      </p>

      <div className="assignmentsGrid">
        {invitations.length === 0 ? (
          <p className="emptyState">No pending invitations.</p>
        ) : (
          invitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentsScreen;
