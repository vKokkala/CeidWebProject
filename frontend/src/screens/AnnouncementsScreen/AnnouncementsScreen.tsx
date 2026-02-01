import { useEffect, useState } from "react";
import api from "../../api/client";

const AnnouncementsScreen = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");

        console.log("res", res);

        setAnnouncements(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  if (loading) return <div>Loading announcements…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="announcements-screen">
      <h1>Announcements</h1>

      {announcements.length === 0 && <p>No announcements available.</p>}

      {announcements.map((x) => (
        <div key={x.id} className="announcement-card">
          <p>{x.text}</p>

          <small>{new Date(x.createdAt).toLocaleString()}</small>

          {x.thesis && (
            <div className="thesis-info">
              <strong>{x.thesis.topic?.title}</strong>
              <p>{x.thesis.topic?.description}</p>

              <p>
                Student:{" "}
                {`${x.thesis.student.user.firstName} ${x.thesis.student.user.lastName}`}
              </p>
              <p>
                Supervisor:{" "}
                {`${x.thesis.supervisor.user.firstName} ${x.thesis.supervisor.user.lastName}`}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsScreen;
