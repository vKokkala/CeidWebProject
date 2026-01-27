import { useEffect, useState, type FormEvent } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const TopicsScreen = () => {
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topics, setTopics] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await api.get("/topic", {
        params: { professorId: user?.professor?.id },
      });

      console.log("data", data);

      setTopics(data);
    };

    if (user?.professor?.id) {
      fetchTopics();
    }
  }, [user?.professor?.id]);

  const createTopic = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = Object.fromEntries(new FormData(e.currentTarget));

    console.log("formData", formData);

    await api.post(
      "/topic",
      { ...formData, professorId: user?.professor.id },
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  };

  return (
    <>
      <div>Topics Screen</div>
      <button
        onClick={() => {
          setShowTopicForm((prev) => !prev);
        }}
      >
        Create New Topic
      </button>

      {showTopicForm && (
        <form onSubmit={createTopic}>
          <label>Title</label>
          <input name="title" />

          <label>Description</label>
          <input name="description" />

          <label>Upload PDF</label>
          <input type="file" name="pdf" accept=".pdf" />

          <button type="submit">Create</button>
        </form>
      )}
    </>
  );
};

export default TopicsScreen;
