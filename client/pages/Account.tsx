import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Account() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Redirect if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/profile/username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update username");
      }

      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setUsernameError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/profile/email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      toast({
        title: "Success",
        description: "Email updated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setEmailError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setPasswordError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      logout();
      navigate("/");

      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-foreground/60 mb-8">Manage your account information</p>

            {/* Current User Info */}
            <div className="bg-background/50 border border-border rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Current Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground/60">Username</p>
                  <p className="text-foreground font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">Email</p>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Update Username */}
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Update Username</h2>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                    New Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-new-username"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                {usernameError && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">{usernameError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || username === user.username}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Username"}
                </button>
              </form>
            </div>

            {/* Update Email */}
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Update Email</h2>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    New Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-new-email@example.com"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                {emailError && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">{emailError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || email === user.email}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Email"}
                </button>
              </form>
            </div>

            {/* Update Password */}
            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field"
                    disabled={isLoading}
                    required
                  />
                </div>

                {passwordError && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">{passwordError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !currentPassword || !newPassword}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Delete Account */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delete Account</h2>
              <p className="text-sm text-foreground/60 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>

              {showDeleteConfirm ? (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-destructive mb-2">
                      Are you sure you want to delete your account?
                    </p>
                    <p className="text-sm text-foreground/60">
                      This action cannot be undone. Type your username to confirm.
                    </p>
                  </div>

                  <input
                    type="text"
                    placeholder={`Type "${user.username}" to confirm`}
                    className="input-field"
                    id="confirmUsername"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const input = (document.getElementById("confirmUsername") as HTMLInputElement);
                        if (input.value === user.username) {
                          handleDeleteAccount();
                        }
                      }}
                      disabled={isLoading}
                      className="btn-destructive disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                    >
                      {isLoading ? "Deleting..." : "Delete Account"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isLoading}
                      className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-destructive"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
