import { Routes, Route, Navigate } from "react-router-dom";
import TopicsScreen from "../screens/TopicsScreen/TopicsScreen";
import { Screens } from "./routes";
import ThesisAllScreen from "../screens/ThesisAllScreen/ThesisAllScreen";
import ThesisScreen from "../screens/ThesisScreen/ThesisScreen";
import EditProfileScreen from "../screens/EditProfileScreen/EditProfileScreen";
import InvitationsScreen from "../screens/InvitationsScreen/InvitationsScreen";
import StatisticsScreen from "../screens/StatisticsScreen/StatisticsScreen";
import StudentThesisScreen from "../screens/StudentThesisScreen/StudentThesisScreen";

const Router = () => {
  const {
    ASSIGNMENTS,
    TOPICS,
    LOGIN_SCREEN,
    THESIS_ALL,
    THESIS,
    EDIT_PROFILE,
    INVITATIONS,
    STATISTICS,
    STUDENT_THESIS,
    ANNOUNCEMENTS
  } = Screens;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={LOGIN_SCREEN} replace />} />
      <Route path={ANNOUNCEMENTS} element={<Navigate to={LOGIN_SCREEN} replace />} />
      <Route path={TOPICS} element={<TopicsScreen />} />
      <Route path="*" element={<Navigate to={TOPICS} replace />} />
      <Route
        path={LOGIN_SCREEN}
        element={<Navigate to={LOGIN_SCREEN} replace />}
      />
      <Route path={THESIS_ALL} element={<ThesisAllScreen />} />
      <Route path={THESIS} element={<ThesisScreen />} />
      <Route path={EDIT_PROFILE} element={<EditProfileScreen />} />
      <Route path={INVITATIONS} element={<InvitationsScreen />} />
      <Route path={STATISTICS} element={<StatisticsScreen />} />
      <Route path={STUDENT_THESIS} element={<StudentThesisScreen />} />
    </Routes>
  );
};

export default Router;
