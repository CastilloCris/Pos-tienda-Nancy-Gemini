let currentAuthUser = null;
let currentAccessToken = null;

export const setCurrentAuthUser = (user) => {
  currentAuthUser = user ?? null;
};

export const setCurrentAccessToken = (token) => {
  currentAccessToken = token ?? null;
};

export const getCurrentAuthUser = () => currentAuthUser;
export const getCurrentAuthUserId = () => currentAuthUser?.id ?? null;
export const getCurrentAccessToken = () => currentAccessToken;
