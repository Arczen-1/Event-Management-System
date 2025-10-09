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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`http://localhost:5000/profile/${user.username}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully");
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (err) {
      alert("Error changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile">
      <h2>User Profile</h2>
      <div className="profile-form">
        <div className="form-group">
          <label>Username</label>
          <div className="read-only-field">{profile.username}</div>
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <div className="read-only-field">{profile.fullName}</div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <div className="read-only-field">{profile.email}</div>
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
        <button className="change-password-btn" onClick={() => setShowPasswordModal(true)}>
          Change Password
        </button>
      </div>
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
            <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
