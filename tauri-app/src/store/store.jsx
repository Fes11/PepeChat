import { makeAutoObservable } from "mobx";
import AuthServices from "../services/AuthService";
import UserServices from "../services/UserService";
import axios from "axios";
import { BASE_URL } from "../http";

export default class Store {
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
      localStorage.removeItem("token");
      this.setAuth(false);
      this.setUser({});
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
    }
  }

  async checkAuth() {
    try {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return;

      const response = await axios.post(
        `${BASE_URL}/api/users/token/refresh/`,
        { refresh },
        { withCredentials: true }
      );

      localStorage.setItem("token", response.data.access);
      this.setAuth(true);

      const userResponse = await UserServices.getProfile();
      this.setUser(userResponse.data);
    } catch (e) {
      console.log(e);
    } finally {
      this.setLoading(false);
    }
  }
}
