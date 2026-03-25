import { request } from "./api";

const insurerService = {
  getActiveInsurers: () => {
    return request({
      method: "GET",
      url: "/public/insurers",
    });
  },
};

export default insurerService;
