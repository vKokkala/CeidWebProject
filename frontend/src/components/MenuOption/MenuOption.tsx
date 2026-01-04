import { useNavigate } from "react-router-dom";
import type { MenuOptionProps } from "./MenuOption.types";

const MenuOption = ({ option }: MenuOptionProps) => {
  const navigate = useNavigate();

  const { title, route } = option;

  const handleClick = () => {
    route && navigate(route);
  };

  return <button onClick={handleClick}>{title}</button>;
};

export default MenuOption;
