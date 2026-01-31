import { useEffect, useState } from "react";
import ThesisCard from "../../components/ThesisCard/ThesisCard";
import "./ThesisAllScreen.css";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

type ThesisStatus =
  | "UNDER_ASSIGNMENT"
  | "ACTIVE"
  | "UNDER_EXAMINATION"
  | "COMPLETED"
  | "CANCELLED";
type RoleFilter = "ALL" | "SUPERVISOR" | "MEMBER";

const statusLabels: Record<ThesisStatus, string> = {
  UNDER_ASSIGNMENT: "Under Assignment",
  ACTIVE: "Active",
  UNDER_EXAMINATION: "Under Examination",
  COMPLETED: "Finished",
  CANCELLED: "Cancelled",
};

const ThesisAllScreen = () => {
  const [theses, setTheses] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<ThesisStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  const { user } = useAuth();
  const professorId = user?.professor?.id;

  useEffect(() => {
    const fetchTheses = async () => {
      const response = await api.get("/thesis");
      console.log("thesesALl", response.data);
      setTheses(response.data);
    };

    fetchTheses();
  }, []);

  const filteredTheses = theses.filter((thesis) => {
    if (statusFilter !== "ALL" && thesis.status !== statusFilter) {
      return false;
    }

    if (roleFilter !== "ALL" && professorId) {
      if (roleFilter === "SUPERVISOR") {
        if (thesis.supervisorId !== professorId) {
          return false;
        }
      } else if (roleFilter === "MEMBER") {
        const isMember = thesis.committeeMembers?.some(
          (member: any) =>
            member.professorId === professorId && member.role === "MEMBER",
        );
        if (!isMember) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="thesisAllScreen">
      <header className="thesisHeader">
        <h1>All Theses</h1>
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

        {professorId && (
          <div className="filterGroup">
            <label>My Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="ALL">All</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="MEMBER">Committee Member</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid">
        {filteredTheses.length === 0 ? (
          <p className="emptyState">No theses found.</p>
        ) : (
          filteredTheses.map((x) => <ThesisCard thesis={x} key={x.id} />)
        )}
      </div>
    </div>
  );
};

export default ThesisAllScreen;
