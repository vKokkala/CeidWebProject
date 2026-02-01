import { useEffect, useState } from "react";
import api from "../../api/client";
import "./AnnouncementsScreen.css";

const AnnouncementsScreen = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const res = await api.get("/announcements");
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

  if (loading) {
    return (
      <div className="announcements-screen">
        <div className="announcements-container">
          <div className="loading-state">Loading announcements...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-screen">
        <div className="announcements-container">
          <div className="error-state">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-screen">
      <div className="announcements-container">
        <div className="announcements-header">
          <h1>Thesis Presentation Announcements</h1>
        </div>

        <div className="announcements-grid">
          {announcements.length === 0 ? (
            <div className="empty-state">No announcements available.</div>
          ) : (
            announcements.map((x) => (
              <div key={x.id} className="announcement-card">
                <p className="announcement-text">{x.text}</p>
                <p className="announcement-date">
                  {new Date(x.createdAt).toLocaleString()}
                </p>

                {x.thesis && (
                  <div className="thesis-info">
                    <h3 className="thesis-title">{x.thesis.topic?.title}</h3>
                    {x.thesis.topic?.description && (
                      <p className="thesis-description">
                        {x.thesis.topic.description}
                      </p>
                    )}
                    <div className="thesis-people">
                      <p className="thesis-person">
                        <span className="thesis-person-label">Student:</span>
                        {`${x.thesis.student.user.firstName} ${x.thesis.student.user.lastName}`}
                      </p>
                      <p className="thesis-person">
                        <span className="thesis-person-label">Supervisor:</span>
                        {`${x.thesis.supervisor.user.firstName} ${x.thesis.supervisor.user.lastName}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsScreen;
