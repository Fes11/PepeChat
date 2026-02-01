import { makeAutoObservable } from "mobx";
import AuthServices from "../services/AuthService";
import UserServices from "../services/UserService";
import axios from "axios";
import { BASE_URL } from "../http";

export default class authStore {
  user = {};
  isAuth = false;
  isLoading = true;

  constructor() {
    makeAutoObservable(this);
  }

  setAuth(bool) {
    this.isAuth = bool;
  }

  setUser(user) {
    this.user = user;
  }

  setLoading(bool) {
    this.isLoading = bool;
  }

  async login(email, password) {
    try {
      localStorage.removeItem("token");

      const response = await AuthServices.login(email, password);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      this.setAuth(true);
      this.setUser(response.data.user);
      console.log(response.data);

      this.ChatStore.connect(response.data.access);
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
    }
  }

  async registration(data) {
    try {
      localStorage.removeItem("token");

      const response = await AuthServices.registrationHttp(data);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      this.setAuth(true);
      this.setUser(response.data.user);
      console.log(response.data);
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
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

      const response = await axios.post(
        `${BASE_URL}/api/users/token/refresh/`,
        { refresh },
        { withCredentials: true },
      );

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
