import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import TopicCard from "../../components/TopicCard/TopicCard";
import "./TopicsScreen.css";

const TopicsScreen = () => {
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateTopicCard, setShowCreateTopicCard] = useState(false);
  const [showAssignmentView, setShowAssignmentView] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignStatus, setAssignStatus] = useState<"success" | "error" | null>(
    null,
  );
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchStudents = useCallback(async () => {
    const { data } = await api.get("/users", {
      params: {
        role: "STUDENT",
      },
    });

    const availableStudents = data.filter((x) => !Boolean(x.student.thesis));

    console.log('availableStudents', availableStudents)

    setStudents(availableStudents);
  }, []);

  const fetchTopics = useCallback(async () => {
    if (!user?.professor?.id) return;

    const { data } = await api.get("/topic", {
      params: { professorId: user?.professor?.id },
    });

    setTopics(data);
  }, [user?.professor?.id]);

  useEffect(() => {
    fetchTopics();
    fetchStudents();
  }, []);

  const handleTopicSaved = () => {
    fetchTopics();
    setShowCreateTopicCard(false);
  };

  // Clear status after 4 seconds
  useEffect(() => {
    if (assignStatus) {
      const timer = setTimeout(() => {
        setAssignStatus(null);
        setAssignMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [assignStatus]);

  const handleAssignTopic = async () => {
    setIsAssigning(true);
    setAssignStatus(null);
    setAssignMessage(null);

    try {
      await api.post("/thesis", {
        professorId: user?.professor?.id,
        topicId: selectedTopicId,
        studentId: selectedStudentId,
        supervisorId: user?.professor?.id,
      });

      setAssignStatus("success");
      setAssignMessage("Topic assigned successfully!");
      setSelectedTopicId(null);
      setSelectedStudentId(null);
      setStudentSearch("");
      fetchTopics();
      fetchStudents();
    } catch (error: any) {
      setAssignStatus("error");
      setAssignMessage(error.response?.data?.error || "Failed to assign topic");
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignedTopics = topics.filter((x) => !x.isAssigned);

  const filteredStudents = students.filter((x: any) => {
    const searchLower = studentSearch.toLowerCase();
    const fullName = `${x.firstName} ${x.lastName}`.toLowerCase();
    const am = x.student?.am?.toLowerCase() || "";
    return fullName.includes(searchLower) || am.includes(searchLower);
  });

  const handleStudentSelect = (student: any) => {
    setSelectedStudentId(student.student?.id);
    setStudentSearch(
      `${student.student?.am} - ${student.firstName} ${student.lastName}`,
    );
    setShowStudentDropdown(false);
  };

  console.log("studfents", selectedStudentId, selectedTopicId);

  if (showAssignmentView) {
    return (
      <div className="topicsScreen">
        <header className="topicsHeader">
          <h1>Assign Topic</h1>
          <button
            className="btn btnSecondary"
            onClick={() => {
              setShowAssignmentView(false);
              setSelectedTopicId(null);
              setSelectedStudentId(null);
              setStudentSearch("");
            }}
          >
            Back
          </button>
        </header>

        <div className="assignmentPanel">
          {assignStatus && (
            <div className={`assignmentStatus ${assignStatus}`}>
              {assignMessage}
            </div>
          )}

          <p className="topicsDescription">
            Select a topic and choose a student to assign it to.
          </p>

          <div className="assignmentControls">
            <div className="selectWrapper">
              <label htmlFor="studentSearch">Search Student:</label>
              <div className="searchWrapper">
                <input
                  type="text"
                  id="studentSearch"
                  className="searchInput"
                  placeholder="Search by name or AM..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                    if (!e.target.value) setSelectedStudentId(null);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowStudentDropdown(false), 150)
                  }
                />
                {showStudentDropdown && studentSearch && (
                  <div className="searchDropdown">
                    {filteredStudents.length === 0 ? (
                      <div className="searchDropdownEmpty">
                        No students found
                      </div>
                    ) : (
                      filteredStudents.map((x: any) => (
                        <div
                          key={x.id}
                          className={`searchDropdownItem ${selectedStudentId === x.student?.id ? "selected" : ""}`}
                          onClick={() => handleStudentSelect(x)}
                        >
                          {x.student?.am} - {x.firstName} {x.lastName}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="selectWrapper">
              <label htmlFor="students">Or select:</label>
              <select
                id="students"
                value={selectedStudentId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedStudentId(id);
                  if (id) {
                    const student = students.find(
                      (x: any) => x.student?.id === id,
                    ) as any;
                    if (student) {
                      setStudentSearch(
                        `${student.student?.am} - ${student.firstName} ${student.lastName}`,
                      );
                    }
                  } else {
                    setStudentSearch("");
                  }
                }}
              >
                <option value="">-- Select a student --</option>
                {students.map((x: any) => (
                  <option key={x.id} value={x.student?.id}>
                    {x.student?.am} - {x.firstName} {x.lastName}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btnPrimary"
              disabled={!selectedStudentId || !selectedTopicId || isAssigning}
              onClick={handleAssignTopic}
            >
              {isAssigning ? "Assigning..." : "Assign Topic"}
            </button>
          </div>

          {selectedTopicId && (
            <p className="selectionInfo">
              Selected:{" "}
              <strong>
                {
                  unassignedTopics.find((t: any) => t.id === selectedTopicId)
                    ?.title
                }
              </strong>
            </p>
          )}
        </div>

        <div className="topicsGrid">
          {unassignedTopics.length === 0 ? (
            <p className="emptyState">No unassigned topics available.</p>
          ) : (
            unassignedTopics.map((topic: any) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                isSelectable
                isSelected={selectedTopicId === topic.id}
                onSelect={() => setSelectedTopicId(topic.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="topicsScreen">
      <header className="topicsHeader">
        <h1>My Topics</h1>
        <div className="buttonsWrapper">
          <button
            className="btn btnPrimary"
            onClick={() => setShowCreateTopicCard(!showCreateTopicCard)}
          >
            {showCreateTopicCard ? "Cancel" : "+ New Topic"}
          </button>
          <button
            className="btn btnSecondary"
            onClick={() => setShowAssignmentView(true)}
          >
            Assign to Student
          </button>
        </div>
      </header>

      <p className="topicsDescription">
        Create a new topic or edit an existing one by clicking the pencil icon.
      </p>

      <div className="topicsGrid">
        {showCreateTopicCard && (
          <TopicCard
            topic={{ title: "", description: "" }}
            isNew
            professorId={user?.professor?.id}
            onSave={handleTopicSaved}
          />
        )}
        {topics.length === 0 && !showCreateTopicCard ? (
          <p className="emptyState">No topics yet. Create your first one!</p>
        ) : (
          topics.map((topic: any) => (
            <TopicCard key={topic.id} topic={topic} onSave={fetchTopics} />
          ))
        )}
      </div>
    </div>
  );
};

export default TopicsScreen;
