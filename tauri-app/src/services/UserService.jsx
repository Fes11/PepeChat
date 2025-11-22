import api from "../http";

export default class UserServices {
    static async getProfile() {
        return api.get('/api/users/profile/')
    }

    static async searchUser(query) {
        return api.get('/api/users/search/?q=' + query)
    }
}