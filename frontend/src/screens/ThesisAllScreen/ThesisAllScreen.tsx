import { useEffect, useState } from "react";
import ThesisCard from "../../components/ThesisCard/ThesisCard";
import "./ThesisAllScreen.css";
import api from "../../api/client";

const ThesisAllScreen = () => {
  const [theses, setTheses] = useState([]);

  useEffect(() => {
    const fetchTheses = async () => {
      const response = await api.get("/thesis");
      console.log("thesesALl", response.data);
      setTheses(response.data);
    };

    fetchTheses();
  }, []);

  return (
    <div className="grid">
      {theses?.map((x) => (
        <ThesisCard thesis={x} key={x.id} />
      ))}
    </div>
  );
};

export default ThesisAllScreen;
