import { useState, useEffect, type FormEvent } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./EditProfileScreen.css";

const EditProfileScreen = () => {
  const { user, updateUser } = useAuth();

  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cellPhoneNumber, setCellPhoneNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  console.log('user', user)

  // Sync form fields when user data loads
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setAddress(user.student?.address || "");
      setCellPhoneNumber(user.student?.cellPhoneNumber || "");
      setPhoneNumber(user.student?.phoneNumber || "");
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const { data } = await api.patch("/user", {
        email,
        address,
        cellPhoneNumber,
        phoneNumber,
      }, {
        params: { userId: user?.id },
      });

      updateUser(data);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editProfileContainer">
      <h2>Edit Profile</h2>
      <p className="profileInfo">
        {user?.firstName} {user?.lastName} ({user?.username})
      </p>

      <form onSubmit={handleSubmit} className="editProfileForm">
        <div className="formGroup">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full postal address"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="cellPhoneNumber">Mobile Phone</label>
          <input
            id="cellPhoneNumber"
            type="tel"
            value={cellPhoneNumber}
            onChange={(e) => setCellPhoneNumber(e.target.value)}
            placeholder="Mobile phone number"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="phoneNumber">Landline Phone</label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Landline phone number"
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p className={message.includes("success") ? "success" : "error"}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default EditProfileScreen;
