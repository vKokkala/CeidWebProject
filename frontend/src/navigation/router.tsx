import { Routes, Route, Navigate } from "react-router-dom";
import AssignmentsScreen from "../screens/AssignmentsScreen/AssignmentsScreen";
import TopicsScreen from "../screens/TopicsScreen/TopicsScreen";
import { Screens } from "./routes";
import ThesisAllScreen from "../screens/ThesisAllScreen/ThesisAllScreen";
import EditProfileScreen from "../screens/EditProfileScreen/EditProfileScreen";
import InvitationsScreen from "../screens/InvitationsScreen/InvitationsScreen";
import StatisticsScreen from "../screens/StatisticsScreen/StatisticsScreen";

const Router = () => {
  const { ASSIGNMENTS, TOPICS, LOGIN_SCREEN, THESIS_ALL, EDIT_PROFILE, INVITATIONS, STATISTICS } =
    Screens;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={LOGIN_SCREEN} replace />} />
      <Route path={ASSIGNMENTS} element={<AssignmentsScreen />} />
      <Route path={TOPICS} element={<TopicsScreen />} />
      <Route path="*" element={<Navigate to={TOPICS} replace />} />
      <Route
        path={LOGIN_SCREEN}
        element={<Navigate to={LOGIN_SCREEN} replace />}
      />
      <Route path={THESIS_ALL} element={<ThesisAllScreen />} />
      <Route path={EDIT_PROFILE} element={<EditProfileScreen />} />
      <Route path={INVITATIONS} element={<InvitationsScreen />} />
      <Route path={STATISTICS} element={<StatisticsScreen />} />
    </Routes>
  );
};

export default Router;
