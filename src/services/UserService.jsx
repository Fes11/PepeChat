import api from "../api";

export default class UserServices {
  static async getProfile() {
    return api.get("/api/users/profile/");
  }

  static async updateProfile(data) {
    return api.patch("/api/users/profile/", data, {
      headers: { "Content-Type": "multipart/form-data" },
      skipErrorNotification: true,
    });
  }

  static async searchUser(query) {
    return api.get("/api/users/search/?q=" + query);
  }
}
