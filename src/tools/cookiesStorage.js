export function clearToken(){
  // 清除token
  localStorage.removeItem('Authorization')

}

export function getToken(){
  // 获取token
  return localStorage.getItem('Authorization')
}

export function setToken(){
  // 设置token
  window.localStorage.setItem("Authorization",JSON.stringify({data:"token",storageExpire :getNowTime()}))
}


// 获取当前时间戳
function getNowTime() {
  return new Date().getTime();
}