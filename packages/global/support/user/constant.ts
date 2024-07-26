export enum UserStatusEnum {
  active = 'active',
  forbidden = 'forbidden'
}
export const userStatusMap = {
  [UserStatusEnum.active]: {
    label: 'support.user.status.active'
  },
  [UserStatusEnum.forbidden]: {
    label: 'support.user.status.forbidden'
  }
};

export const userStatus = [
  { label: 'active', value: 'active' },
  { label: 'forbidden', value: 'forbidden' }
];

export enum OAuthEnum {
  github = 'github',
  google = 'google',
  wechat = 'wechat'
}
