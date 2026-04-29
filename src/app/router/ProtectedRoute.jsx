import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearAuthData, getAccessToken } from "../api/authStorage";
import { getMe } from "../api/userApi";
import { PATHS } from "./paths";

export function ProtectedRoute({ children }) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let ignore = false;

    const checkLogin = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (!ignore) {
          setIsAllowed(false);
          setLoading(false);
        }

        return;
      }

      try {
        await getMe();

        if (!ignore) {
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("CHECK LOGIN ERROR:", error);
        clearAuthData();

        if (!ignore) {
          setIsAllowed(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    checkLogin();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Checking login...</div>;
  }

  if (!isAllowed) {
    return (
      <Navigate
        to={PATHS.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}