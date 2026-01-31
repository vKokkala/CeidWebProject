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

  const { user } = useAuth();

  const fetchStudents = useCallback(async () => {
    const { data } = await api.get("/users", {
      params: {
        role: "STUDENT",
      },
    });

    console.log("data", data);
    setStudents(data);
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

  const unassignedTopics = topics.filter((x) => !x.isAssigned);

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
            }}
          >
            Back
          </button>
        </header>

        <div className="assignmentPanel">
          <p className="topicsDescription">
            Select a topic and choose a student to assign it to.
          </p>

          <div className="assignmentControls">
            <div className="selectWrapper">
              <label htmlFor="students">Student:</label>
              <select
                id="students"
                value={selectedStudentId ?? ""}
                onChange={(e) =>
                  setSelectedStudentId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">-- Select a student --</option>
                {students.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.student?.am} - {x.firstName} {x.lastName}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btnPrimary"
              disabled={!selectedStudentId || !selectedTopicId}
            >
              Assign Topic
            </button>
          </div>

          {selectedTopicId && (
            <p className="selectionInfo">
              Selected:{" "}
              <strong>
                {unassignedTopics.find((t: any) => t.id === selectedTopicId)?.title}
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
