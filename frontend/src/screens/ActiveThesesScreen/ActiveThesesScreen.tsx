import { useEffect, useState } from "react";
import ThesisCard from "../../components/ThesisCard/ThesisCard";
import "./ActiveThesesScreen.css";
import api from "../../api/client";

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

const ActiveThesesScreen = () => {
  const [theses, setTheses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ThesisStatus | "ALL">("ALL");

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        const response = await api.get("/thesis");
        setTheses(response.data);
      } catch (err) {
        console.error("Failed to fetch theses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheses();
  }, []);

  const filteredTheses = theses.filter((thesis) => {
    if (statusFilter !== "ALL" && thesis.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="activeThesesScreen">
        <p className="loadingText">Loading theses...</p>
      </div>
    );
  }

  return (
    <div className="activeThesesScreen">
      <header className="thesesHeader">
        <h1>Active Theses</h1>
      </header>

      <div className="filtersPanel">
        <div className="filterGroup">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ThesisStatus | "ALL")
            }
          >
            <option value="ALL">All</option>
            <option value="UNDER_ASSIGNMENT">
              {statusLabels.UNDER_ASSIGNMENT}
            </option>
            <option value="ACTIVE">{statusLabels.ACTIVE}</option>
            <option value="UNDER_EXAMINATION">
              {statusLabels.UNDER_EXAMINATION}
            </option>
            <option value="COMPLETED">{statusLabels.COMPLETED}</option>
            <option value="CANCELLED">{statusLabels.CANCELLED}</option>
          </select>
        </div>
      </div>

      <div className="thesesGrid">
        {filteredTheses.length === 0 ? (
          <p className="emptyState">No theses found.</p>
        ) : (
          filteredTheses.map((thesis) => (
            <ThesisCard thesis={thesis} key={thesis.id} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveThesesScreen;
