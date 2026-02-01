import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import InvitationCard from "../../components/InvitationCard/InvitationCard";
import "./InvitationsScreen.css";

const InvitationsScreen = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!user?.professor?.id) return;

    try {
      const { data } = await api.get("/invitation", {
        params: { professorId: user.professor.id },
      });
      setInvitations(data);
    } catch (error) {
      console.error("Failed to fetch invitations", error);
    } finally {
      setLoading(false);
    }
  }, [user?.professor?.id]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (id: number) => {
    try {
      await api.post(`/invitation/${id}/accept`);
      fetchInvitations();
    } catch (error: any) {
      console.error("Failed to accept invitation", error);
      alert(error.response?.data?.error || "Failed to accept invitation");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/invitation/${id}/reject`);
      fetchInvitations();
    } catch (error: any) {
      console.error("Failed to reject invitation", error);
      alert(error.response?.data?.error || "Failed to reject invitation");
    }
  };

  const mappedInvitations = invitations.map((inv) => ({
    id: inv.id,
    title: inv.thesis?.topic?.title || "Untitled Thesis",
    studentName: inv.thesis?.student?.user
      ? `${inv.thesis.student.user.firstName} ${inv.thesis.student.user.lastName}`
      : "Unknown",
    role: inv.Role === "MEMBER" ? "Committee Member" : inv.Role,
  }));

  if (loading) {
    return (
      <div className="assignmentsScreen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="assignmentsScreen">
      <header className="assignmentsHeader">
        <h1>Invitations</h1>
      </header>

      <p className="assignmentsDescription">
        Pending invitations to participate in thesis committees.
      </p>

      <div className="assignmentsGrid">
        {mappedInvitations.length === 0 ? (
          <p className="emptyState">No pending invitations.</p>
        ) : (
          mappedInvitations.map((invitation) => (
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

export default InvitationsScreen;
