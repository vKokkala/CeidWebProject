import { UserType } from "../../constants";

const BaseUserMenuOptions = [{ title: "Edit Profile" }];

export const UserMenu = {
  [UserType.Professor]: {
    options: [
      { title: "Topics" },
      { title: "Assignments" },
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
