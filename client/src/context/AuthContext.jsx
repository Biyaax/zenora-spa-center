import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("zenoraUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email) => {
    const guestUser = {
      id: 1,
      firstName: "Guest",
      lastName: "User",
      email,
      role: "Guest",
    };

    setUser(guestUser);

    localStorage.setItem(
      "zenoraUser",
      JSON.stringify(guestUser)
    );

    return guestUser;
  };

  const register = (formData) => {
    const guestUser = {
      id: Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: "Guest",
    };

    setUser(guestUser);

    localStorage.setItem(
      "zenoraUser",
      JSON.stringify(guestUser)
    );

    return guestUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("zenoraUser");
  };

  const value = {
    user,
    isLoggedIn: Boolean(user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

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