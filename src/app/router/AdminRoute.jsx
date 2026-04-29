import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { clearAuthData, getAccessToken } from "../api/authStorage";
import { getMe } from "../api/userApi";
import { PATHS } from "./paths";

function isAdminUser(user) {
  const role = String(user?.role || "").trim().toLowerCase();

  return role === "admin" || role === "administrator";
}

export function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowAccess, setAllowAccess] = useState(false);
  const [redirectTo, setRedirectTo] = useState("");

  useEffect(() => {
    let ignore = false;

    const checkAdminPermission = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        clearAuthData();

        if (!ignore) {
          setRedirectTo(PATHS.login);
          setLoading(false);
        }

        return;
      }

      try {
        const user = await getMe();

        if (!ignore) {
          if (isAdminUser(user)) {
            setAllowAccess(true);
          } else {
            setRedirectTo(PATHS.home);
          }
        }
      } catch (error) {
        console.error("CHECK ADMIN PERMISSION ERROR:", error);

        clearAuthData();

        if (!ignore) {
          setRedirectTo(PATHS.login);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    checkAdminPermission();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Checking permission...</div>;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowAccess) {
    return <Navigate to={PATHS.home} replace />;
  }

  return children;
}