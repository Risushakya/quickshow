import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/react';
import axios from 'axios';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const currency = import.meta.env.VITE_CURRENCY || '$';
  const baseURL = import.meta.env.VITE_BASE_URL;

  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(true);

  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    user?.id === import.meta.env.VITE_ADMIN_USER_ID;

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/api/show`);
      if (data.success) setShows(data.shows);
    } catch (e) {
      console.error('fetchShows error:', e.message);
    } finally {
      setShowsLoading(false);
    }
  };

  const syncUser = async () => {
    try {
      const headers = await authHeaders();
      await axios.post(`${baseURL}/api/user/sync`, {}, { headers });
    } catch (e) {
      console.error('syncUser error:', e.message);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) syncUser();
  }, [user?.id]);

  const value = {
    currency,
    baseURL,
    shows,
    showsLoading,
    isAdmin,
    isLoaded,
    user,
    fetchShows,
    authHeaders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
