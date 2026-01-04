import { Routes, Route, Navigate } from "react-router-dom";
import AssignmentsScreen from "../screens/AssignmentsScreen/AssignmentsScreen";
import TopicsScreen from "../screens/TopicsScreen/TopicsScreen";
import { Screens } from "./routes";

const Router = () => {
  const { ASSIGNMENTS, TOPICS } = Screens;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={TOPICS} replace />} />
      <Route path={ASSIGNMENTS} element={<AssignmentsScreen />} />
      <Route path={TOPICS} element={<TopicsScreen />} />
      <Route path="*" element={<Navigate to={TOPICS} replace />} />
    </Routes>
  );
};

export default Router;
