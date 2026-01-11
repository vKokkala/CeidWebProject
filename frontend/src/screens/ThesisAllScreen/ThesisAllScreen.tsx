import ThesisCard from "../../components/ThesisCard/ThesisCard";
import "./ThesisAllScreen.css";

const ThesisAllScreen = () => {
  const theses = [
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
    {
      title: "title 1",
      description: "description 1",
    },
    {
      title: "title 2",
      description: "description 2",
    },
  ];

  console.log(
    "ere, ",
    theses.map((x) => x)
  );

  return (
    <div className="grid">
      {theses.map((x) => (
        <ThesisCard thesis={x} key={x.title} />
      ))}
    </div>
  );
};

export default ThesisAllScreen;
