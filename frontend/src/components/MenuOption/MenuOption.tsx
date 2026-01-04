import type { MenuOptionProps } from "./MenuOption.types";

const MenuOption = ({ title }: MenuOptionProps) => {
  const handleClick = () => {
    console.log(`Clicked on menu item: ${title}`);
  };

  return <button onClick={handleClick}>{title}</button>;
};

export default MenuOption;
