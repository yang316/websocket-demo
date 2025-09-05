import axios from 'axios'

// 创建axios实例
const instance = axios.create({
    baseURL: '/api',
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' }
});

// 响应拦截器
instance.interceptors.response.use(
    response => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // 处理token过期，可以在这里添加刷新token的逻辑
            console.log('Token expired, please login again');
            // await refreshToken();
            // return instance(error.config);
        }
        return Promise.reject(error);
    }
);

// 请求函数
export const request = async (url, method = 'get', data = {}) => {
    try {
        const config = {
            url,
            method: method.toLowerCase(),
        };

        // 根据请求方法设置数据
        if (method.toLowerCase() === 'get') {
            config.params = data;
        } else {
            config.data = data;
        }

        const response = await instance(config);
        return response;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}
