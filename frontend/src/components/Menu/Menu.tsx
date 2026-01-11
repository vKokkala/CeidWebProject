import { UserType } from "../../constants";
import MenuOption from "../MenuOption/MenuOption";
import { UserMenu } from "./Menu.constants";

const Menu = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {UserMenu[UserType.Faculty].options.map((x) => (
        <MenuOption option={x}/>
      ))}
    </div>
  );
};

export default Menu;
