import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./ThesisScreen.css";

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

const ThesisScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thesis, setThesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  console.log("thesis", thesis);

  useEffect(() => {
    const fetchThesis = async () => {
      try {
        const response = await api.get(`/thesis/${id}`);
        setThesis(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load thesis");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchThesis();
    }
  }, [id]);

  const handleCancelAssignment = async () => {
    if (!thesis || !user?.professor?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this assignment? This will delete the thesis and free the student for a new assignment."
    );

    if (!confirmed) return;

    setCancelLoading(true);
    try {
      await api.post(`/thesis/${thesis.id}/cancel-assignment`, {
        supervisorId: user.professor.id,
        reason: "Assignment cancelled by supervisor",
      });
      navigate(-1);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel assignment");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="thesisScreen">
        <p className="loadingText">Loading...</p>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="thesisScreen">
        <p className="errorText">{error || "Thesis not found"}</p>
        <button className="btn btnSecondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const studentName = thesis.student?.user
    ? `${thesis.student.user.firstName} ${thesis.student.user.lastName}`
    : "Unknown";

  const supervisorName = thesis.supervisor?.user
    ? `${thesis.supervisor.user.firstName} ${thesis.supervisor.user.lastName}`
    : "Unknown";

  const committeeMembers = thesis.committeeMembers || [];
  const committeMemberIds = committeeMembers.map(x => x.professorId);

  const isCompleted = thesis.status === "COMPLETED";
  const isUnderAssignment = thesis.status === "UNDER_ASSIGNMENT";
  const isSupervisor = user?.professor?.id === thesis.supervisorId;
  const canCancel = isUnderAssignment && isSupervisor;

  return (
    <div className="thesisScreen">
      <header className="thesisScreenHeader">
        <button className="btn btnSecondary" onClick={() => navigate(-1)}>
          Back
        </button>
        <div
          className={`statusBadge status-${thesis.status?.toLowerCase().replace("_", "-")}`}
        >
          {statusLabels[thesis.status as ThesisStatus] || thesis.status}
        </div>
        {canCancel && (
          <button
            className="btn btnDanger"
            onClick={handleCancelAssignment}
            disabled={cancelLoading}
          >
            {cancelLoading ? "Cancelling..." : "Cancel Assignment"}
          </button>
        )}
      </header>

      <h1 className="thesisTitle">{thesis.topic?.title || "No Topic"}</h1>
      <p className="thesisDescription">
        {thesis.topic?.description || "No description"}
      </p>

      {/* Basic Information */}
      <section className="thesisSection">
        <h2>Basic Information</h2>
        <div className="infoGrid">
          <div className="infoItem">
            <span className="infoLabel">Student</span>
            <span className="infoValue">{studentName}</span>
          </div>
          <div className="infoItem">
            <span className="infoLabel">Supervisor</span>
            <span className="infoValue">{supervisorName}</span>
          </div>
          {thesis.topic?.pdfFileName && thesis.topic.id && (
            <div className="infoItem">
              <span className="infoLabel">Topic PDF</span>
              <a
                href={`${api.defaults.baseURL}/topic/${thesis.topic.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="infoLink"
              >
                {thesis.topic.pdfFileName}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Committee */}
      <section className="thesisSection">
        <h2>Committee</h2>
        <div className="committeeList">
          <div className="committeeItem">
            <span className="committeeName">
              {thesis.supervisor?.user?.firstName}{" "}
              {thesis.supervisor?.user?.lastName}
            </span>
            <span className="committeeRole roleAccepted">Supervisor</span>
          </div>

          {committeeMembers.map((member: any) => {
            const invitation = thesis.committeeInvitations?.find(
              (inv: any) => inv.professorId === member.professorId
            );
            return (
              <div key={member.id} className="committeeItem">
                <div className="committeeItemMain">
                  <span className="committeeName">
                    {member.professor?.user?.firstName}{" "}
                    {member.professor?.user?.lastName}
                  </span>
                  <span className="committeeRole roleAccepted">Member</span>
                </div>
                <div className="committeeItemDates">
                  {invitation?.createdAt && (
                    <span className="committeeDate">
                      Invited: {new Date(invitation.createdAt).toLocaleString("el-GR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {member.acceptedAt && (
                    <span className="committeeDate">
                      Accepted: {new Date(member.acceptedAt).toLocaleString("el-GR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {thesis.committeeInvitations
            ?.filter((inv: any) => !committeMemberIds.includes(inv.professorId))
            .map((invitation: any) => (
              <div key={invitation.id} className="committeeItem">
                <div className="committeeItemMain">
                  <span className="committeeName">
                    {invitation.professor?.user?.firstName}{" "}
                    {invitation.professor?.user?.lastName}
                  </span>
                  <span
                    className={`committeeRole role${invitation.invitationStatus}`}
                  >
                    {invitation.invitationStatus === "PENDING" && "Pending"}
                    {invitation.invitationStatus === "ACCEPTED" && "Accepted"}
                    {invitation.invitationStatus === "REJECTED" && "Rejected"}
                    {invitation.invitationStatus === "CANCELLED" && "Cancelled"}
                  </span>
                </div>
                <div className="committeeItemDates">
                  <span className="committeeDate">
                    Invited: {new Date(invitation.createdAt).toLocaleString("el-GR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {invitation.invitationStatus !== "PENDING" && invitation.repliedAt && (
                    <span className="committeeDate">
                      Replied: {new Date(invitation.repliedAt).toLocaleString("el-GR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}

          {committeeMembers.length === 0 &&
            (!thesis.committeeInvitations ||
              thesis.committeeInvitations.length === 0) && (
              <p className="emptyText">No committee members invited yet.</p>
            )}
        </div>
      </section>

      {/* Status Timeline */}
      <section className="thesisSection">
        <h2>Status History</h2>
        {thesis.statusChanges?.length === 0 ? (
          <p className="emptyText">No status changes recorded.</p>
        ) : (
          <div className="timeline">
            {thesis.statusChanges?.map((change: any) => (
              <div key={change.id} className="timelineItem">
                <div className="timelineContent">
                  <div className="timelineHeader">
                    <span className="timelineStatus">
                      {change.fromStatus
                        ? `${statusLabels[change.fromStatus as ThesisStatus] || change.fromStatus} → `
                        : ""}
                      {statusLabels[change.toStatus as ThesisStatus] ||
                        change.toStatus}
                    </span>
                    <span className="timelineDate">
                      {new Date(change.changedAt).toLocaleDateString("el-GR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {change.notes && (
                    <p className="timelineNotes">{change.notes}</p>
                  )}
                  <p className="timelineBy">by {change.changedBy}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Section - Final Grade & Links */}
      {isCompleted && (
        <section className="thesisSection completedSection">
          <h2>Completion Details</h2>
          <div className="infoGrid">
            {thesis.finalGrade && (
              <div className="infoItem">
                <span className="infoLabel">Final Grade</span>
                <span className="infoValue finalGrade">
                  {thesis.finalGrade}
                </span>
              </div>
            )}
            {thesis.completedAt && (
              <div className="infoItem">
                <span className="infoLabel">Completed At</span>
                <span className="infoValue">
                  {new Date(thesis.completedAt).toLocaleDateString("el-GR")}
                </span>
              </div>
            )}
            {thesis.nemertisLink && (
              <div className="infoItem">
                <span className="infoLabel">Library Repository</span>
                <a
                  href={thesis.nemertisLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="infoLink"
                >
                  View in Nemertis
                </a>
              </div>
            )}
          </div>

          {/* Grades from committee */}
          {thesis.grades?.length > 0 && (
            <div className="gradesSection">
              <h3>Committee Grades</h3>
              <div className="gradesList">
                {thesis.grades.map((grade: any) => (
                  <div key={grade.id} className="gradeItem">
                    <div className="gradeHeader">
                      <span className="graderName">
                        {grade.professor?.user?.firstName}{" "}
                        {grade.professor?.user?.lastName}
                      </span>
                      <span className="gradeValue">{grade.totalGrade}</span>
                    </div>
                    {grade.comments && (
                      <p className="gradeComments">{grade.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ThesisScreen;
