export const SOCKET_URL = process.env.NODE_ENV !== 'production' && process.env.REACT_APP_SOCKET_URL ? process.env.REACT_APP_SOCKET_URL : process.env.PUBLIC_URL
export const API_URL = process.env.NODE_ENV !== 'production' && process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '/api'
