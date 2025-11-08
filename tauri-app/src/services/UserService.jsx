import api from "../http";

export default class UserServices {
    static async getProfile() {
        return api.get('/api/users/profile/')
    }
}