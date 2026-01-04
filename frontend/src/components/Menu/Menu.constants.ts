import { UserType } from "../../constants";
import { Screens } from "../../navigation/routes";

const BaseUserMenuOptions = [{ title: "Edit Profile" }];

export const UserMenu = {
  [UserType.Professor]: {
    options: [
      { title: "Topics", route: Screens.TOPICS },
      { title: "Assignments", route: Screens.ASSIGNMENTS },
      { title: "Theses All" },
      { title: "Invitations" },
      { title: "Statistics" },
    ],
  },
  [UserType.Student]: {
    options: [{ title: "Thesis" }],
  },
  [UserType.Faculty]: {
    options: [
      { title: "Active Theses" },
      { title: "Import Data" },
      { title: "Theses All " },
    ],
  },
};
