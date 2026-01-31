import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import TopicCard from "../../components/TopicCard/TopicCard";
import "./TopicsScreen.css";

const TopicsScreen = () => {
  const [topics, setTopics] = useState([]);
  const [showCreateTopicCard, setShowCreateTopicCard] = useState(false);

  const { user } = useAuth();

  const fetchTopics = useCallback(async () => {
    if (!user?.professor?.id) return;

    const { data } = await api.get("/topic", {
      params: { professorId: user?.professor?.id },
    });

    setTopics(data);
  }, [user?.professor?.id]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleTopicSaved = () => {
    fetchTopics();
    setShowCreateTopicCard(false);
  };

  return (
    <>
      <div>Topics Screen</div>

      <button onClick={() => setShowCreateTopicCard(!showCreateTopicCard)}>
        {showCreateTopicCard ? "Dismiss new topic form" : "Create new topic"}
      </button>
      <button> Assign to Student</button>

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
        {topics.map((topic: any) => (
          <TopicCard key={topic.id} topic={topic} onSave={fetchTopics} />
        ))}
      </div>
    </>
  );
};

export default TopicsScreen;
