import Axios from "axios";
import { ElNotification } from "element-plus";
import { clearToken, getToken } from "../tools/cookiesStorage";
import {
  addPendingRequest,
  removePendingRequest,
} from "../tools/encapsulationAxios/cancelRepeatRquest";
import {
  requestInterceptor as cacheReqInterceptor,
  responseInterceptor as cacheResInterceptor,
} from "../tools/encapsulationAxios/requestCache";
import { againRequest } from "../tools/encapsulationAxios/requestAgainSend";

// 返回结果处理
// 自定义约定接口返回 {code: xxx, data: xxx, msg:'err message}

const responseHandle = {
  200: (response) => {
    return response;
  },
  401: (response) => {
    ElNotification({
      title: "认证异常",
      message: "登录状态也过期，请从新登录！",
      type: "error",
    });
    // 清除token
    clearToken();
    window.location.href = window.location.origin;
  },
  default: (response) => {
    ElNotification({
      title: "操作失败",
      message: response.data.msg,
      type: "error",
    });
    return Promise.reject(response);
  },
};

const axios = Axios.create({
  // baseURL: "http://192.168.209.208:80",
  timeout: 50000,
});

// 添加请求拦截器
axios.interceptors.request.use(
  function(config) {
    // 请求头用于接口token认证
    getToken() && (config.headers["Authorization"] = getToken());
    
    if (
      config.method.toLocaleLowerCase() === "post" ||
      config.method.toLocaleLowerCase() === "put"
    ) {
      // 参数统一处理， 请求都是要data传参
      config.data = config.data.data;
    } else if (
      config.method.toLocaleLowerCase() === "get" ||
      config.method.toLocaleLowerCase() === "delete"
    ) {
      config.params = config.data;
    } else {
      alert("不允许的请求方法：" + config.method);
    }
    // pendding 中的请求 后续请求不发送（由于存放的peddingMap 的key 和参数有关，所以放在参数处理之后）
    addPendingRequest(config); // 把当前请求信息添加到pendingRequest 对象中
    // 请求缓存
    cacheReqInterceptor(config, axios);
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

// 添加响应拦截器

axios.interceptors.response.use(
  (response) => {
    //  响应正常时候就从pendingRequest对象中移除请求
    removePendingRequest(response);
    cacheResInterceptor(response);
    console.log(response.status);
    return responseHandle[response.status || "default"](response);
  },
  (error) => {
    // 从pending 列表中移除请求
    removePendingRequest(error.config || {});
    // 需要特殊处理请求被取消的情况
    if (!Axios.isCancel(error)) {
      // 请求重发
      againRequest(error, axios);
    }
    // 请求缓存处理
    if (
      Axios.isCancel(error) &&
      error.message.data &&
      error.message.data.config.cache
    ) {
      return Promise.resolve(error.message.data.data.data); // 返回结果数据
    }
    return Promise.reject(error);
  }
);
export default axios;
