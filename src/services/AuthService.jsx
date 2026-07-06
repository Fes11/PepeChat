import api from "../api";

export default class AuthServices {
  static async login(login, password) {
    return api.post("/api/users/login/", { login, password }, {
      skipErrorNotification: true,
    });
  }

  static async registrationHttp(data) {
    return api.post("/api/users/register/", data, {
      skipErrorNotification: true,
    });
  }

  static async logout() {
    return api.post("/api/users/logout/", {
      refresh_token: localStorage.getItem("refresh"),
    });
  }
}
