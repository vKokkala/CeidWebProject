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
      ? `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
      : `${years} year${years > 1 ? 's' : ''}`;
  }
  if (months > 0) {
    const remainingDays = days % 30;
    return remainingDays > 0
      ? `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
      : `${months} month${months > 1 ? 's' : ''}`;
  }
  return `${days} day${days !== 1 ? 's' : ''}`;
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

  // Form state
  const [formData, setFormData] = useState({
    examinationDate: "",
    examinationMode: "" as "ONSITE" | "ONLINE" | "",
    examinationPlace: "",
    nemertisLink: "",
    relevantLinks: [] as string[],
  });
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  useEffect(() => {
    if (thesis) {
      setFormData({
        examinationDate: thesis.examinationDate
          ? new Date(thesis.examinationDate).toISOString().slice(0, 16)
          : "",
        examinationMode: thesis.examinationMode || "",
        examinationPlace: thesis.examinationPlace || "",
        nemertisLink: thesis.nemertisLink || "",
        relevantLinks: thesis.relevantLinks || [],
      });
    }
  }, [thesis]);

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

  const updateFormField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    setFormData((prev) => ({
      ...prev,
      relevantLinks: [...prev.relevantLinks, newLink.trim()],
    }));
    setNewLink("");
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      relevantLinks: prev.relevantLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSaveForm = async () => {
    setSaving(true);
    setFormMessage(null);
    try {
      await api.patch(`/thesis/${thesisId}`, {
        examinationDate: formData.examinationDate || null,
        examinationMode: formData.examinationMode || null,
        examinationPlace: formData.examinationPlace || null,
        nemertisLink: formData.nemertisLink || null,
        relevantLinks: formData.relevantLinks,
      });
      fetchThesis();
      setFormMessage({ type: "success", text: "Changes saved successfully" });
    } catch (err: any) {
      console.error("Failed to save", err);
      setFormMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save changes",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("document", file);
      await api.post(`/thesis/${thesisId}/document`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchThesis();
    } catch (err: any) {
      console.error("Failed to upload document", err);
      alert(err.response?.data?.error || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  };

  const handleViewDocument = async () => {
    if (!thesisId) return;

    try {
      const response = await api.get(`/thesis/${thesisId}/document`, {
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

  const committeMemberIds = committeeMembers.map((x) => x.professorId);

  const isCompleted = thesis.status === "COMPLETED";
  const isUnderAssignment = thesis.status === "UNDER_ASSIGNMENT";
  const isUnderExamination = thesis.status === "UNDER_EXAMINATION";

  console.log("isUnderAssignment", isUnderAssignment);

  return (
    <div className="studentThesisScreen">
      <header className="studentThesisHeader">
        <h1>My Thesis</h1>
        <div className="statusInfo">
          <div
            className={`statusBadge status-${thesis.status?.toLowerCase().replace("_", "-")}`}
          >
            {statusLabels[thesis.status as ThesisStatus] || thesis.status}
          </div>
          {thesis.officialAssignmentDate && (
            <span className="timeSinceAssignment">
              {formatTimeSince(thesis.officialAssignmentDate)} since assignment
            </span>
          )}
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

          {thesis.committeeInvitations
            ?.filter((inv: any) => !committeMemberIds.includes(inv.professorId))
            .map((invitation: any) => (
              <div key={invitation.id} className="committeeItem">
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
                </span>
              </div>
            ))}

          {committeeMembers.length === 0 &&
            (!thesis.committeeInvitations ||
              thesis.committeeInvitations.length === 0) &&
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

      {/* Under Assignment Section - Single Form */}
      {isUnderExamination && (
        <section className="thesisSection underAssignmentSection">
          <h3>Examination & Submission Details</h3>

          <div className="thesisForm">
            {/* Examination Date & Time */}
            <div className="formRow">
              <label className="formLabel">Examination Date & Time</label>
              <input
                type="datetime-local"
                className="formInput"
                value={formData.examinationDate}
                onChange={(e) =>
                  updateFormField("examinationDate", e.target.value)
                }
              />
            </div>

            {/* Examination Mode */}
            <div className="formRow">
              <label className="formLabel">Examination Mode</label>
              <div className="radioGroup">
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="examinationMode"
                    value="ONSITE"
                    checked={formData.examinationMode === "ONSITE"}
                    onChange={(e) =>
                      updateFormField("examinationMode", e.target.value)
                    }
                  />
                  In-Person
                </label>
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="examinationMode"
                    value="ONLINE"
                    checked={formData.examinationMode === "ONLINE"}
                    onChange={(e) =>
                      updateFormField("examinationMode", e.target.value)
                    }
                  />
                  Online
                </label>
              </div>
            </div>

            {/* Examination Place/Link */}
            <div className="formRow">
              <label className="formLabel">
                {formData.examinationMode === "ONLINE"
                  ? "Meeting Link"
                  : "Examination Room"}
              </label>
              <input
                type={formData.examinationMode === "ONLINE" ? "url" : "text"}
                className="formInput"
                placeholder={
                  formData.examinationMode === "ONLINE"
                    ? "Enter meeting URL..."
                    : "Enter room name/number..."
                }
                value={formData.examinationPlace}
                onChange={(e) =>
                  updateFormField("examinationPlace", e.target.value)
                }
              />
            </div>

            {/* Draft Document */}
            <div className="formRow">
              <label className="formLabel">Draft Thesis Document (PDF)</label>
              <div className="documentSection">
                {thesis.thesisDocument ? (
                  <div className="documentDisplay">
                    <button
                      type="button"
                      onClick={handleViewDocument}
                      className="btn btnSmall btnSecondary"
                    >
                      View Current Document
                    </button>
                    <label className="btn btnSmall btnSecondary uploadLabel">
                      {uploadingDocument ? "Uploading..." : "Replace"}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleDocumentUpload}
                        disabled={uploadingDocument}
                        hidden
                      />
                    </label>
                  </div>
                ) : (
                  <label className="btn btnSmall btnSecondary uploadLabel">
                    {uploadingDocument ? "Uploading..." : "Upload Document"}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDocument}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Relevant Links */}
            <div className="formRow">
              <label className="formLabel">
                Additional Materials (Google Drive, YouTube, etc.)
              </label>
              <div className="linksSection">
                {formData.relevantLinks.length > 0 && (
                  <ul className="linksList">
                    {formData.relevantLinks.map((link, index) => (
                      <li key={index} className="linkItem">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="infoLink"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          className="btn btnSmall btnDanger"
                          onClick={() => handleRemoveLink(index)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="addLinkForm">
                  <input
                    type="url"
                    className="formInput"
                    placeholder="Add link..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddLink())
                    }
                  />
                  <button
                    type="button"
                    className="btn btnSmall btnSecondary"
                    onClick={handleAddLink}
                    disabled={!newLink.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {thesis.status === "COMPLETED" && (
              <>
                <div className="formRow">
                  <label className="formLabel">
                    Library Repository (Nemertis)
                  </label>
                  <input
                    type="url"
                    className="formInput"
                    placeholder="Enter Nemertis repository URL..."
                    value={formData.nemertisLink}
                    onChange={(e) =>
                      updateFormField("nemertisLink", e.target.value)
                    }
                  />
                </div>

                <div className="formRow">
                  <label className="formLabel">Examination Report</label>
                  <a
                    href={`${api.defaults.baseURL}/thesis/${thesisId}/examination-report`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btnSmall btnSecondary reportLink"
                  >
                    View Examination Report (HTML)
                  </a>
                </div>
              </>
            )}

            <div className="formActions">
              {formMessage && (
                <span className={`formMessage ${formMessage.type}`}>
                  {formMessage.text}
                </span>
              )}
              <button
                type="button"
                className="btn btnPrimary"
                onClick={handleSaveForm}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>
      )}

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
