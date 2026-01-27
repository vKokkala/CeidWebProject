import { useState, type FormEvent } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "./EditProfileScreen.css";

const EditProfileScreen = () => {
  const { user, updateUser } = useAuth();
  const { email, firstName, lastName, username, student } = user || {};
  const { address, cellPhoneNumber, phoneNumber } = student || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);

    try {
      const { data } = await api.patch("/user", Object.fromEntries(formData), {
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
        {firstName} {lastName} ({username})
      </p>

      <form onSubmit={handleSubmit} className="editProfileForm">
        <div className="formGroup">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            placeholder="Email"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            defaultValue={address}
            placeholder="Full postal address"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="cellPhoneNumber">Mobile Phone</label>
          <input
            id="cellPhoneNumber"
            name="cellPhoneNumber"
            type="tel"
            defaultValue={cellPhoneNumber}
            placeholder="Mobile phone number"
          />
        </div>

        <div className="formGroup">
          <label htmlFor="phoneNumber">Landline Phone</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            defaultValue={phoneNumber}
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
