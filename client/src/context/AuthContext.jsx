import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  api,
  getToken,
  setToken,
} from "../api/client";

const AuthContext = createContext(null);

function normalizeUser(rawUser) {
  if (!rawUser) {
    return null;
  }

  return {
    ...rawUser,

    firstName:
      rawUser.firstName ??
      rawUser.first_name ??
      "",

    lastName:
      rawUser.lastName ??
      rawUser.last_name ??
      "",

    role:
      rawUser.role ??
      rawUser.role_name ??
      "",
  };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  function saveUser(rawUser) {
    const nextUser = normalizeUser(rawUser);

    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem(
        "zenoraUser",
        JSON.stringify(nextUser)
      );
    } else {
      localStorage.removeItem("zenoraUser");
    }
  }

  useEffect(() => {
    const token = getToken();

    const savedUser =
      localStorage.getItem("zenoraUser");

    if (token && savedUser) {
      try {
        saveUser(
          JSON.parse(savedUser)
        );
      } catch {
        setToken(null);
        localStorage.removeItem(
          "zenoraUser"
        );
      }
    } else {
      setToken(null);
      localStorage.removeItem(
        "zenoraUser"
      );
    }

    setAuthLoading(false);

    function handleUnauthorized() {
      setToken(null);
      saveUser(null);
    }

    window.addEventListener(
      "zenora:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "zenora:unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  async function login(
    emailOrData,
    passwordArg
  ) {
    let email;
    let password;

    if (
      typeof emailOrData === "object"
    ) {
      email = emailOrData.email;
      password =
        emailOrData.password;
    } else {
      email = emailOrData;
      password = passwordArg;
    }

    if (!email || !password) {
      throw new Error(
        "Email and password are required."
      );
    }

    const data = await api(
      "/auth/login",
      {
        method: "POST",

        body: {
          email: email.trim(),
          password,
        },
      }
    );

    if (!data?.token) {
      throw new Error(
        "The server did not return a login token."
      );
    }

    if (!data?.user) {
      throw new Error(
        "The server did not return user information."
      );
    }

    setToken(data.token);
    saveUser(data.user);

    return normalizeUser(
      data.user
    );
  }

  async function register(
    formData
  ) {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      throw new Error(
        "Please complete all required fields."
      );
    }

    const data = await api(
      "/auth/register",
      {
        method: "POST",

        body: {
          firstName:
            formData.firstName.trim(),

          lastName:
            formData.lastName.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            formData.phone?.trim() ||
            null,

          password:
            formData.password,
        },
      }
    );

    if (!data?.token) {
      throw new Error(
        "The server did not return a registration token."
      );
    }

    if (!data?.user) {
      throw new Error(
        "The server did not return user information."
      );
    }

    setToken(data.token);
    saveUser(data.user);

    return normalizeUser(
      data.user
    );
  }

  function logout() {
    setToken(null);
    saveUser(null);
  }

  const value = {
    user,

    authLoading,

    isLoggedIn:
      Boolean(user),

    isAuthenticated:
      Boolean(user),

    login,
    register,
    logout,

    signIn: login,
    signUp: register,
    signOut: logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export {
  AuthProvider,
  useAuth,
};