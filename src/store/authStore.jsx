import { makeAutoObservable, runInAction } from "mobx";
import AuthServices from "../services/AuthService";
import UserServices from "../services/UserService";
import { refreshAccessToken } from "../api";
import LocalCacheService from "../services/LocalCacheService";
import { normalizeApiErrors } from "../utils/errors";

const getRefreshAccountId = (refreshToken) => {
  try {
    const payload = refreshToken.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)).user_id ?? null;
  } catch {
    return null;
  }
};

export default class authStore {
  user = {};
  isAuth = false;
  isInitializing = true;
  initializationPromise = null;
  ChatStore;

  constructor(ChatStore) {
    makeAutoObservable(this, { initializationPromise: false });
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
    if (user?.id != null) this.ChatStore?.setCachedProfile(user);
  }

  async login(login, password) {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      this.ChatStore.disconnect();
      this.ChatStore.reset();
      this.ChatStore.accountId = null;

      const response = await AuthServices.login(login, password);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      LocalCacheService.setActiveAccountId(response.data.user.id);
      await this.ChatStore.useAccount(response.data.user.id, response.data.user);
      this.setAuth(true);
      this.setUser(response.data.user);

      this.ChatStore.connect(response.data.access);
      return { ok: true, errors: {} };
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
      return { ok: false, errors: normalizeApiErrors(e, "Не удалось войти.") };
    }
  }

  async registration(data) {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      this.ChatStore.disconnect();
      this.ChatStore.reset();
      this.ChatStore.accountId = null;

      const response = await AuthServices.registrationHttp(data);
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      LocalCacheService.setActiveAccountId(response.data.user.id);
      await this.ChatStore.useAccount(response.data.user.id, response.data.user);
      this.setAuth(true);
      this.setUser(response.data.user);
      console.log(response.data);
      this.ChatStore.connect(response.data.access);
      return { ok: true, errors: {} };
    } catch (e) {
      console.log(e.response?.data?.message || e.message);
      return { ok: false, errors: normalizeApiErrors(e, "Не удалось зарегистрироваться.") };
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
      this.ChatStore.accountId = null;
      LocalCacheService.setActiveAccountId(null);
    }
  }

  initializeAuth() {
    if (!this.initializationPromise) {
      this.initializationPromise = this.checkAuth();
    }

    return this.initializationPromise;
  }

  async checkAuth() {
    let authenticatedUser = null;

    try {
      const refresh = localStorage.getItem("refresh");

      if (!refresh) return;

      // The token identity is authoritative; the convenience pointer alone
      // must never select another account's snapshot.
      const tokenAccountId = getRefreshAccountId(refresh);
      const activeAccountId = LocalCacheService.getActiveAccountId();
      const accountId = tokenAccountId ?? activeAccountId;

      if (accountId != null) {
        authenticatedUser = await this.ChatStore.useAccount(accountId);
        if (authenticatedUser) {
          runInAction(() => {
            this.setAuth(true);
            this.setUser(authenticatedUser);
          });
        }
      }

      await refreshAccessToken(refresh);
      const userResponse = await UserServices.getProfile();
      authenticatedUser = userResponse.data;
      LocalCacheService.setActiveAccountId(authenticatedUser.id);
      await this.ChatStore.useAccount(authenticatedUser.id, authenticatedUser);
    } catch (e) {
      console.log(e);
      // Network errors keep the last authenticated, account-scoped snapshot
      // available. HTTP auth errors still end the local session.
      if ([401, 403].includes(e.response?.status)) {
        authenticatedUser = null;
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        LocalCacheService.setActiveAccountId(null);
        this.ChatStore.reset();
        this.ChatStore.accountId = null;
      }
    } finally {
      runInAction(() => {
        this.setAuth(Boolean(authenticatedUser));
        this.setUser(authenticatedUser ?? {});
        this.isInitializing = false;
      });
    }
  }
}
