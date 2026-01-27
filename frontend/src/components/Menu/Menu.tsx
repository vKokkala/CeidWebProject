import MenuOption from "../MenuOption/MenuOption";
import { UserMenu } from "./Menu.constants";
import type { Role } from "../../types";
import "./Menu.css";

export type MenuProps = {
  userRole: Role;
  onLogout: () => void;
};

const Menu = ({ userRole, onLogout }: MenuProps) => {
  return (
    <div className="menuWrapper">
      {UserMenu[userRole]?.options.map((x) => (
        <MenuOption option={x} />
      ))}
      <button className="logoutButton" onClick={onLogout}>Logout</button>
    </div>
  );
};

export default Menu;
