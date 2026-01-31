import { Screens } from "../../navigation/routes";
import type { Role } from "../../types";

const BaseUserMenuOptions = [{ title: "Edit Profile" }];

export const UserMenu: Record<
  Role,
  { options: { title: string; route?: string }[] }
> = {
  PROFESSOR: {
    options: [
      { title: "Topics", route: Screens.TOPICS },
      { title: "Assignments", route: Screens.ASSIGNMENTS },
      { title: "Theses All", route: Screens.THESIS_ALL },
      { title: "Invitations", route: Screens.INVITATIONS },
      { title: "Statistics", route: Screens.STATISTICS },
    ],
  },
  STUDENT: {
    options: [
      { title: "Thesis", route: Screens.STUDENT_THESIS },
      { title: "Edit profile", route: Screens.EDIT_PROFILE },
    ],
  },
  SECRETARIAT: {
    options: [
      { title: "Active Theses" },
      { title: "Import Data" },
      { title: "Theses All ", route: Screens.THESIS_ALL },
    ],
  },
};
