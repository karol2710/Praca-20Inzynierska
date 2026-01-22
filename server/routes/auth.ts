import { RequestHandler } from "express";
import { query } from "../db";
import {
  generateToken,
  hashPassword,
  verifyPassword,
  verifyToken,
} from "../auth";

interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body as SignupRequest;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Username or email already exists",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.username);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body as LoginRequest;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Find user
    const result = await query(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const token = generateToken(user.id, user.username);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

export const handleGetCurrentUser: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get full user data from database
    const result = await query("SELECT id, username, email FROM users WHERE id = $1", [
      user.userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  // JWT logout is handled on the client side by removing the token
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const handleUpdateUsername: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username is already taken by another user
    const existingUser = await query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [username, user.userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Update username
    const result = await query(
      "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email",
      [username, user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = result.rows[0];
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error: any) {
    console.error("Update username error:", error);
    res.status(500).json({ error: "Failed to update username" });
  }
};

export const handleUpdateEmail: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email } = req.body;

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email is already taken by another user
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, user.userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Update email
    const result = await query(
      "UPDATE users SET email = $1 WHERE id = $2 RETURNING id, username, email",
      [email, user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = result.rows[0];
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error: any) {
    console.error("Update email error:", error);
    res.status(500).json({ error: "Failed to update email" });
  }
};

export const handleUpdatePassword: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    // Get current user password hash
    const result = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password_hash } = result.rows[0];

    // Verify current password
    const passwordMatch = await verifyPassword(currentPassword, password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, user.userId]
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};

export const handleDeleteAccount: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Delete user account
    const result = await query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
