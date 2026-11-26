import React, { useEffect, useState } from "react";

import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import HomePage from "../pages/HomePage";
import EditProfilePage from "../pages/EditProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import ProfilePage from "../pages/ProfilePage";
import UserDirectoryPage from "../pages/UserDirectoryPage";
import { getStoredUser } from "../utils/authUtils";

const getRoute = () => {
  const profileMatch = window.location.pathname.match(/^\/users\/([^/]+)$/);
  if (profileMatch) {
    return { page: "profile", userId: decodeURIComponent(profileMatch[1]) };
  }
  if (window.location.pathname === "/users") {
    return { page: "users", userId: null };
  }
  if (window.location.pathname === "/edit-profile") {
    return { page: "edit-profile", userId: null };
  }
  if (window.location.pathname === "/change-password") {
    return { page: "change-password", userId: null };
  }
  return { page: "home", userId: null };
};

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(getStoredUser);
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(getRoute());
  };

  if (user) {
    if (route.page === "users") {
      return (
        <UserDirectoryPage
          onOpenProfile={(userId) => navigate(`/users/${userId}`)}
          onBackHome={() => navigate("/")}
        />
      );
    }

    if (route.page === "profile") {
      return (
        <ProfilePage
          userId={route.userId}
          currentUser={user}
          setUser={setUser}
          onOpenProfile={(userId) => navigate(`/users/${userId}`)}
          onBrowseUsers={() => navigate("/users")}
          onBackHome={() => navigate("/")}
          onEditProfile={() => navigate("/edit-profile")}
          onChangePassword={() => navigate("/change-password")}
        />
      );
    }

    if (route.page === "edit-profile") {
      return (
        <EditProfilePage
          user={user}
          setUser={setUser}
          onBackHome={() => navigate("/")}
          onOpenProfile={(userId) => navigate(`/users/${userId}`)}
          onChangePassword={() => navigate("/change-password")}
        />
      );
    }

    if (route.page === "change-password") {
      return (
        <ChangePasswordPage
          user={user}
          onBackHome={() => navigate("/")}
          onOpenProfile={(userId) => navigate(`/users/${userId}`)}
          onEditProfile={() => navigate("/edit-profile")}
        />
      );
    }

    return (
      <HomePage
        user={user}
        setUser={setUser}
        onBrowseUsers={() => navigate("/users")}
        onOpenProfile={(userId) => navigate(`/users/${userId}`)}
        onEditProfile={() => navigate("/edit-profile")}
        onChangePassword={() => navigate("/change-password")}
      />
    );
  }

  if (showLogin) {
    return (
      <LoginForm
        setUser={setUser}
        onBackToRegister={() => setShowLogin(false)}
      />
    );
  }

  return <RegisterForm onShowLogin={() => setShowLogin(true)} />;
}

export default App;