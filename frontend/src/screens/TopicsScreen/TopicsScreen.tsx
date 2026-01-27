import { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import TopicCard from "../../components/TopicCard/TopicCard";
import "./TopicsScreen.css";

const TopicsScreen = () => {
  const [topics, setTopics] = useState([]);
  const { user } = useAuth();

  console.log('topics', topics)

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await api.get("/topic", {
        params: { professorId: user?.professor?.id },
      });

      setTopics(data);
    };

    if (user?.professor?.id) {
      fetchTopics();
    }
  }, [user?.professor?.id]);

  return (
    <>
      <div>Topics Screen</div>

      <button> Assign to Student </button>
      <button> Create new topic </button>

      <p className="topicsDescription">
        Create a new topic or edit an existing one by clicking the pencil icon.
      </p>

      <div className="topicsGrid">
        <TopicCard
          topic={{ title: "", description: "" }}
          isNew
          professorId={user?.professor?.id}
        />
        {topics.map((topic: any) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </>
  );
};

export default TopicsScreen;
