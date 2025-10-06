import React, { useEffect, useState } from "react";
import "./Profile.css";

function Profile({ user, onLogout }) {
  const [profile, setProfile] = useState({
    username: "",
    fullName: "",
    email: "",
    mobile: "",
    landline: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
      } else {
        alert("Failed to load profile");
      }
    } catch (err) {
      alert("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: profile.mobile,
          landline: profile.landline,
          address: profile.address,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully");
        setProfile(data.user);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile">
      <h2>User Profile</h2>
      <div className="profile-form">
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={profile.username} readOnly />
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={profile.fullName} readOnly />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={profile.email} readOnly />
        </div>
        <div className="form-group">
          <label>Mobile Number</label>
          <input
            type="text"
            name="mobile"
            value={profile.mobile}
            onChange={handleChange}
            placeholder="Enter mobile number"
          />
        </div>
        <div className="form-group">
          <label>Landline Number</label>
          <input
            type="text"
            name="landline"
            value={profile.landline}
            onChange={handleChange}
            placeholder="Enter landline number"
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea
            name="address"
            value={profile.address}
            onChange={handleChange}
            placeholder="Enter address"
            rows={3}
          />
        </div>
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default Profile;
