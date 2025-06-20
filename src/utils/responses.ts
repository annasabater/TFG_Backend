// utils/responses.ts
export const buildAuthResponse = (
  user: any,             // mongoose doc
  accessToken: string,
  refreshToken: string,
) => ({
  accessToken,
  refreshToken,
  user: {
    _id      : user._id,
    userName : user.userName,
    email    : user.email,
    role     : user.role,
  },
});
