import { makeAutoObservable } from "mobx";
import AuthServices from "../services/AuthService";
import UserServices from "../services/UserService";
import { api } from "../api";

const normalizeAuthErrors = (error) => {
  const data = error.response?.data;

  if (!data) {
    return { non_field_errors: [error.message] };
  }

  if (typeof data === "string") {
    return { non_field_errors: [data] };
  }

  if (data.error) {
    if (typeof data.error === "string") {
      return { non_field_errors: [data.error] };
    }

    if (data.error.message) {
      return { non_field_errors: [data.error.message] };
    }
  }

  if (data.detail) {
    return { non_field_errors: [data.detail] };
  }

  if (data.message) {
    return { non_field_errors: [data.message] };
  }

  return data;
};

export default class authStore {
  user = {};
  isAuth = false;
  isLoading = true;
  ChatStore;

  constructor(ChatStore) {
    makeAutoObservable(this);
    this.ChatStore = ChatStore;
    this.ChatStore.setPresenceListener((event) => {
      if (this.user.id !== event.user_id) return;
      this.setUser({
        ...this.user,
        status: event.status,
        last_online: event.last_seen,
      });
    });
  }

  setAuth(bool) {
    this.isAuth = bool;
  }

  setUser(user) {
    this.user = user;
    this.ChatStore?.setCurrentUser(user);
  }

  setLoading(bool) {
    this.isLoading = bool;
  }

  async login(login, password) {
    try {
      localStorage.removeItem("token");
      this.ChatStore.disconnect();
      this.ChatStore.reset();

      const response = await AuthServices.login(login, password);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      this.setAuth(true);
      this.setUser(response.data.user);
      console.log(response.data);

      this.ChatStore.connect(response.data.access);
      return { ok: true, errors: {} };
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
      return { ok: false, errors: normalizeAuthErrors(e) };
    }
  }

  async registration(data) {
    try {
      localStorage.removeItem("token");
      this.ChatStore.disconnect();
      this.ChatStore.reset();

      const response = await AuthServices.registrationHttp(data);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      this.setAuth(true);
      this.setUser(response.data.user);
      console.log(response.data);
      this.ChatStore.connect(response.data.access);
      return { ok: true, errors: {} };
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
      return { ok: false, errors: normalizeAuthErrors(e) };
    }
  }

  async logout() {
    try {
      await AuthServices.logout();
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      this.setAuth(false);
      this.setUser({});
      this.ChatStore.disconnect();
      this.ChatStore.reset();
    }
  }

  async checkAuth() {
    try {
      const refresh = localStorage.getItem("refresh");

      if (!refresh) {
        this.setAuth(false);
        this.setUser({});
        this.setLoading(false);
        return;
      }

      const response = await api.post("/api/users/token/refresh/", {
        refresh,
      });

      localStorage.setItem("token", response.data.access);
      this.setAuth(true);

      const userResponse = await UserServices.getProfile();
      this.setUser(userResponse.data);
    } catch (e) {
      console.log(e);
      this.setAuth(false);
      this.setUser({});
    } finally {
      this.setLoading(false);
    }
  }
}
