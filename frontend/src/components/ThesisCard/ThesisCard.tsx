import "./ThesisCard.css"

const ThesisCard = ({ thesis }: any) => {
  const { title, description } = thesis;

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-description">{description}</div>
    </div>
  );
};

export default ThesisCard;
