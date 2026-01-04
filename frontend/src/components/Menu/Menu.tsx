import { UserType } from "../../constants";
import MenuOption from "../MenuOption/MenuOption";
import { UserMenu } from "./Menu.constants";

const Menu = () => {
  return (
    <div>
      {UserMenu[UserType.Professor].options.map((x) => (
        <MenuOption title={x.title} />
      ))}
    </div>
  );
};

export default Menu;
