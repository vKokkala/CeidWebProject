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

      {announcements.map((a) => (
        <div key={a.id} className="announcement-card">
          <p>{a.text}</p>

          <small>{new Date(a.createdAt).toLocaleString()}</small>

          {a.thesis && (
            <div className="thesis-info">
              <strong>{a.thesis.topic?.title}</strong>
              <p>{a.thesis.topic?.description}</p>

              <p>Student: {a.thesis.student.user.name}</p>
              <p>Supervisor: {a.thesis.supervisor.user.name}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsScreen;
