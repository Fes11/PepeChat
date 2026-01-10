import api from "../http";

export default class AuthServices {
  static async login(email, password) {
    return api.post("/api/users/login/", { email, password });
  }

  static async registrationHttp(data) {
    return api.post("/api/users/register/", data);
  }

  static async logout() {
    return api.post("/api/users/logout/");
  }
}
