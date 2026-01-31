import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./StudentThesisScreen.css";

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

const StudentThesisScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add committee member state
  const [professors, setProfessors] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [professorSearch, setProfessorSearch] = useState("");
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(
    null,
  );

  console.log("thesis", thesis);

  const thesisId = user?.student?.thesis?.id;

  const fetchThesis = async () => {
    if (!thesisId) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/thesis/${thesisId}`);
      setThesis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load thesis");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const response = await api.get("/users", {
        params: { role: "PROFESSOR" },
      });
      setProfessors(response.data || []);
    } catch (err) {
      console.error("Failed to fetch professors", err);
    }
  };

  useEffect(() => {
    fetchThesis();
  }, [thesisId]);

  useEffect(() => {
    if (showAddMember) {
      fetchProfessors();
    }
  }, [showAddMember]);

  const availableProfessors = professors.filter((prof) => {
    if (prof.professor?.id === thesis?.supervisorId) {
      return false;
    }
    const isAlreadyMember = thesis?.committeeMembers?.some(
      (member: any) => member.professorId === prof.professor?.id,
    );
    if (isAlreadyMember) {
      return false;
    }
    const isAlreadyInvited = thesis?.committeeInvitations?.some(
      (invitation: any) => invitation.professorId === prof.professor?.id,
    );
    if (isAlreadyInvited) {
      return false;
    }
    return true;
  });

  // Filter by search
  const filteredProfessors = availableProfessors.filter((prof) => {
    const searchLower = professorSearch.toLowerCase();
    const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
    return fullName.includes(searchLower);
  });

  const handleProfessorSelect = (prof: any) => {
    setSelectedProfessorId(prof.professor?.id);
    setProfessorSearch(`${prof.firstName} ${prof.lastName}`);
    setShowProfessorDropdown(false);
  };

  const handleAddCommitteeMember = async () => {
    if (!selectedProfessorId) return;

    try {
      await api.post(`/thesis/${thesisId}/committee`, {
        professorId: selectedProfessorId,
      });
      setShowAddMember(false);
      setProfessorSearch("");
      setSelectedProfessorId(null);
      fetchThesis();
    } catch (err: any) {
      console.error("Failed to add committee member", err);
      alert(err.response?.data?.error || "Failed to add committee member");
    }
  };

  const handleCancelAddMember = () => {
    setShowAddMember(false);
    setProfessorSearch("");
    setSelectedProfessorId(null);
  };

  if (loading) {
    return (
      <div className="studentThesisScreen">
        <p className="loadingText">Loading...</p>
      </div>
    );
  }

  if (!thesisId) {
    return (
      <div className="studentThesisScreen">
        <div className="noThesisMessage">
          <h2>No Thesis Assigned</h2>
          <p>You don't have a thesis assigned yet.</p>
        </div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="studentThesisScreen">
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

  const isCompleted = thesis.status === "COMPLETED";
  const isUnderAssignment = thesis.status === "UNDER_ASSIGNMENT";

  return (
    <div className="studentThesisScreen">
      <header className="studentThesisHeader">
        <h1>My Thesis</h1>
        <div
          className={`statusBadge status-${thesis.status?.toLowerCase().replace("_", "-")}`}
        >
          {statusLabels[thesis.status as ThesisStatus] || thesis.status}
        </div>
      </header>

      <h2 className="thesisTitle">{thesis.topic?.title || "No Topic"}</h2>
      <p className="thesisDescription">
        {thesis.topic?.description || "No description"}
      </p>

      {/* Basic Information */}
      <section className="thesisSection">
        <h3>Basic Information</h3>
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
        <div className="sectionHeader">
          <h3>Committee</h3>
          {isUnderAssignment && !showAddMember && (
            <button
              className="btn btnSmall btnPrimary"
              onClick={() => setShowAddMember(true)}
            >
              + Add Member
            </button>
          )}
        </div>

        {showAddMember && (
          <div className="addMemberPanel">
            <div className="searchWrapper">
              <input
                type="text"
                className="searchInput"
                placeholder="Search professor by name..."
                value={professorSearch}
                onChange={(e) => {
                  setProfessorSearch(e.target.value);
                  setShowProfessorDropdown(true);
                  if (!e.target.value) setSelectedProfessorId(null);
                }}
                onFocus={() => setShowProfessorDropdown(true)}
                onBlur={() =>
                  setTimeout(() => setShowProfessorDropdown(false), 150)
                }
              />
              {showProfessorDropdown && professorSearch && (
                <div className="searchDropdown">
                  {filteredProfessors.length === 0 ? (
                    <div className="searchDropdownEmpty">
                      No professors found
                    </div>
                  ) : (
                    filteredProfessors.map((prof) => (
                      <div
                        key={prof.id}
                        className={`searchDropdownItem ${selectedProfessorId === prof.professor?.id ? "selected" : ""}`}
                        onClick={() => handleProfessorSelect(prof)}
                      >
                        {prof.firstName} {prof.lastName}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="addMemberActions">
              <button
                className="btn btnSmall btnSecondary"
                onClick={handleCancelAddMember}
              >
                Cancel
              </button>
              <button
                className="btn btnSmall btnPrimary"
                onClick={handleAddCommitteeMember}
                disabled={!selectedProfessorId}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="committeeList">
          <div className="committeeItem">
            <span className="committeeName">
              {thesis.supervisor?.user?.firstName}{" "}
              {thesis.supervisor?.user?.lastName}
            </span>
            <span className="committeeRole roleAccepted">Supervisor</span>
          </div>

          {committeeMembers.map((member: any) => (
            <div key={member.id} className="committeeItem">
              <span className="committeeName">
                {member.professor?.user?.firstName}{" "}
                {member.professor?.user?.lastName}
              </span>
              <span className="committeeRole roleAccepted">Member</span>
            </div>
          ))}

          {thesis.committeeInvitations?.map((invitation: any) => (
            <div key={invitation.id} className="committeeItem">
              <span className="committeeName">
                {invitation.professor?.user?.firstName}{" "}
                {invitation.professor?.user?.lastName}
              </span>
              <span className={`committeeRole role${invitation.invitationStatus}`}>
                {invitation.invitationStatus === "PENDING" && "Pending"}
                {invitation.invitationStatus === "ACCEPTED" && "Accepted"}
                {invitation.invitationStatus === "REJECTED" && "Rejected"}
              </span>
            </div>
          ))}

          {committeeMembers.length === 0 &&
           (!thesis.committeeInvitations || thesis.committeeInvitations.length === 0) &&
           !showAddMember && (
            <p className="emptyText">No committee members invited yet.</p>
          )}
        </div>
      </section>

      {/* Status Timeline */}
      <section className="thesisSection">
        <h3>Status History</h3>
        {thesis.statusChanges?.length === 0 ? (
          <p className="emptyText">No status changes recorded.</p>
        ) : (
          <div className="timeline">
            {thesis.statusChanges?.map((change: any) => (
              <div key={change.id} className="timelineItem">
                <div className="timelineDot"></div>
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
          <h3>Completion Details</h3>
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
              <h4>Committee Grades</h4>
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

export default StudentThesisScreen;
