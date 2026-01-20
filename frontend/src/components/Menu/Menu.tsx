import MenuOption from "../MenuOption/MenuOption";
import { UserMenu } from "./Menu.constants";
import type { Role } from "../../types";
import "./Menu.css";

export type MenuProps = {
  userRole: Role;
};

const Menu = ({ userRole }: MenuProps) => {
  console.log("userRole", userRole);

  return (
    <div className="menuWrapper">
      {UserMenu[userRole]?.options.map((x) => (
        <MenuOption option={x} />
      ))}
    </div>
  );
};

export default Menu;
