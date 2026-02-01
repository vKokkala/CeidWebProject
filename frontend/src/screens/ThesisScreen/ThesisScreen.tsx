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

interface ThesisNote {
  id: number;
  note: string;
  professorId: number;
  thesisId: number;
}

const ThesisScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thesis, setThesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [notes, setNotes] = useState<ThesisNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [examinationLoading, setExaminationLoading] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [gradeValue, setGradeValue] = useState(null);
  const [existingAnnouncement, setExistingAnnouncement] = useState<{
    id: number;
    text: string;
  } | null>(null);

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

  useEffect(() => {
    if (id) {
      fetchThesis();
    }
  }, [id]);

  // Fetch notes when thesis is active and user is a professor
  useEffect(() => {
    const fetchNotes = async () => {
      if (!thesis || thesis.status !== "ACTIVE" || !user?.professor?.id) return;

      try {
        const response = await api.get(`/thesis/${thesis.id}/notes`, {
          params: { professorId: user.professor.id },
        });
        setNotes(response.data);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      }
    };

    fetchNotes();
  }, [thesis, user?.professor?.id]);

  const handleCreateAnnouncement = async () => {
    if (!thesis || !user?.professor?.id || !announcementText) return;

    console.log("announcementText", announcementText);
    console.log("user.professor.id", user.professor.id);

    setAnnouncementLoading(true);
    try {
      const response = await api.post(`/thesis/${thesis.id}/announcement`, {
        supervisorId: user.professor.id,
        text: announcementText.trim(),
      });
      setExistingAnnouncement(response.data);
      setAnnouncementText("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create announcement");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!thesis || !user?.professor?.id || !newNote.trim()) return;

    setNoteLoading(true);
    try {
      const response = await api.post(`/thesis/${thesis.id}/notes`, {
        professorId: user.professor.id,
        note: newNote.trim(),
      });
      setNotes([response.data, ...notes]);
      setNewNote("");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleCancelAssignment = async () => {
    if (!thesis || !user?.professor?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this assignment? This will delete the thesis and free the student for a new assignment.",
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

  const handleStartExamination = async () => {
    if (!thesis || !user?.professor?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to move this thesis to examination phase?",
    );

    if (!confirmed) return;

    setExaminationLoading(true);
    try {
      await api.post(`/thesis/${thesis.id}/start-examination`, {
        supervisorId: user.professor.id,
      });
      // Refresh thesis data
      const response = await api.get(`/thesis/${thesis.id}`);
      setThesis(response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to start examination");
    } finally {
      setExaminationLoading(false);
    }
  };

  const handleViewDocument = async () => {
    if (!thesis?.id) return;

    try {
      const response = await api.get(`/thesis/${thesis.id}/document`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to view document");
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
  const committeMemberIds = committeeMembers.map((x) => x.professorId);

  const isCompleted = thesis.status === "COMPLETED";
  const isActive = thesis.status === "ACTIVE";
  const isUnderAssignment = thesis.status === "UNDER_ASSIGNMENT";
  const isUnderExamination = thesis.status === "UNDER_EXAMINATION";
  const isSupervisor = user?.professor?.id === thesis.supervisorId;
  const canCancel = isUnderAssignment && isSupervisor;
  const canStartExamination = isActive && isSupervisor;
  const isProfessor = !!user?.professor?.id;
  const canAddNotes = isActive && isProfessor;

  // Announcement: only supervisor when active and presentation details are filled
  const presentationDetailsFilled = !!(
    thesis.examinationDate &&
    thesis.examinationMode &&
    thesis.examinationPlace
  );

  const handleEnableGrading = async () => {
    if (!thesis || !user?.professor?.id || !isSupervisor) return;

    try {
      const response = await api.patch(`/thesis/${thesis.id}`, {
        isGradingEnabled: true,
      });
      setThesis(response.data);
      alert("Grading is now enabled");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to enable grading");
    }
  };

  const handleGradeThesis = async () => {
    if (!thesis || !user?.professor?.id || !gradeValue) return;

    try {
      await api.post(`/thesis/${thesis.id}/grades`, {
        professorId: user?.professor?.id,
        grade: gradeValue
      });
      alert("Graded successfully");
      fetchThesis();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to grade thesis");
    }
  };

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
        {canStartExamination && (
          <button
            className="btn btnWarning"
            onClick={handleStartExamination}
            disabled={examinationLoading}
          >
            {examinationLoading ? "Starting..." : "Start Examination"}
          </button>
        )}
        {isUnderExamination && isSupervisor && !thesis.isGradingEnabled && (
          <button
            className="btn btnWarning"
            onClick={handleEnableGrading}
            disabled={examinationLoading}
          >
            Enable grading
          </button>
        )}
        {thesis.isGradingEnabled && (
          <div className={`statusBadge status-completed`}>
            Grading is enabled
          </div>
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
          {thesis.examinationDate && (
            <div className="infoItem">
              <span className="infoLabel">Examination Date</span>
              <span className="infoValue">
                {new Date(thesis.examinationDate).toLocaleString("el-GR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
          {thesis.examinationMode && (
            <div className="infoItem">
              <span className="infoLabel">Examination Mode</span>
              <span className="infoValue">
                {thesis.examinationMode === "ONSITE" ? "In-Person" : "Online"}
              </span>
            </div>
          )}
          {thesis.examinationPlace && (
            <div className="infoItem">
              <span className="infoLabel">
                {thesis.examinationMode === "ONLINE" ? "Meeting Link" : "Room"}
              </span>
              {thesis.examinationMode === "ONLINE" ? (
                <a
                  href={thesis.examinationPlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="infoLink"
                >
                  {thesis.examinationPlace}
                </a>
              ) : (
                <span className="infoValue">{thesis.examinationPlace}</span>
              )}
            </div>
          )}
          {thesis.thesisDocument && (
            <div className="infoItem">
              <span className="infoLabel">Draft Document</span>
              <button
                type="button"
                onClick={handleViewDocument}
                className="infoLink linkButton"
              >
                View Document
              </button>
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
        {thesis.relevantLinks?.length > 0 && (
          <div className="relevantLinksDisplay">
            <span className="infoLabel">Additional Materials</span>
            <ul className="linksList">
              {thesis.relevantLinks.map((link: string, index: number) => (
                <li key={index} className="linkItemDisplay">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="infoLink"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {thesis.status !== "COMPLETED" && user?.role !== "SECRETARIAT" && (
        <section className="thesisSection">
          <h2>Grade this thesis</h2>

          <div className="addLinkForm">
            <input
              type="url"
              className="formInput"
              onChange={(e) => setGradeValue(e.target.value)}
              onKeyDown={(e) => setGradeValue(e.target.value)}
            />
            <button
              type="button"
              className="btn btnSmall btnSecondary"
              onClick={handleGradeThesis}
            >
              Submit Grade
            </button>
          </div>

          <ul>
            {thesis.grades?.length > 0 &&
              thesis.grades.map((x: any) => (
                <li>{`${x.professor.user.lastName} ${x.professor.user.firstName}:  ${x.totalGrade}`}</li>
              ))}
          </ul>
        </section>
      )}

      {/* Presentation Announcement - Supervisor only when active */}
      {isUnderExamination && isSupervisor && (
        <section className="thesisSection announcementSection">
          <h2>Presentation Announcement</h2>
          {!presentationDetailsFilled ? (
            <p className="emptyText">
              The student must fill in the presentation details (date, mode,
              place) before an announcement can be created.
            </p>
          ) : existingAnnouncement ? (
            <div className="announcementDisplay">
              <p className="announcementBadge">Announcement Published</p>
              <div className="announcementTextDisplay">
                {existingAnnouncement.text}
              </div>
            </div>
          ) : (
            <div className="announcementForm">
              <p className="announcementInfo">
                Write the presentation announcement text below:
              </p>
              <textarea
                className="announcementTextarea"
                placeholder="Enter the announcement text..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={6}
              />
              <button
                className="btn btnPrimary"
                onClick={handleCreateAnnouncement}
                disabled={announcementLoading || !announcementText.trim()}
              >
                {announcementLoading ? "Publishing..." : "Publish Announcement"}
              </button>
            </div>
          )}
        </section>
      )}

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
              (inv: any) => inv.professorId === member.professorId,
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
                      Invited:{" "}
                      {new Date(invitation.createdAt).toLocaleString("el-GR", {
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
                      Accepted:{" "}
                      {new Date(member.acceptedAt).toLocaleString("el-GR", {
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
                    Invited:{" "}
                    {new Date(invitation.createdAt).toLocaleString("el-GR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {invitation.invitationStatus !== "PENDING" &&
                    invitation.repliedAt && (
                      <span className="committeeDate">
                        Replied:{" "}
                        {new Date(invitation.repliedAt).toLocaleString(
                          "el-GR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
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

      {canAddNotes && (
        <section className="thesisSection">
          <h2>My Notes</h2>
          <p className="notesInfo">Private notes visible only to you</p>

          <div className="noteForm">
            <textarea
              className="noteInput"
              placeholder="Add a note (max 300 characters)..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value.slice(0, 300))}
              maxLength={300}
            />
            <div className="noteFormFooter">
              <span className="charCount">{newNote.length}/300</span>
              <button
                className="btn btnPrimary"
                onClick={handleAddNote}
                disabled={noteLoading || !newNote.trim()}
              >
                {noteLoading ? "Adding..." : "Add Note"}
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="emptyText">No notes yet.</p>
          ) : (
            <div className="notesList">
              {notes.map((note) => (
                <div key={note.id} className="noteItem">
                  <p className="noteText">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
