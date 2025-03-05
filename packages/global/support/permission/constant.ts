export enum AuthUserTypeEnum {
  token = 'token',
  root = 'root',
  apikey = 'apikey',
  outLink = 'outLink',
  teamDomain = 'teamDomain'
}

export enum PermissionTypeEnum {
  'private' = 'private',
  'public' = 'public'
}

export enum DatasetModeEnum {
  'accurate' = 'accurate',
  'vague' = 'vague'
}

export const DatasetModeMap = {
  [DatasetModeEnum.accurate]: {
    iconLight: 'support/permission/privateLight',
    label: 'dataset.Mode.Accurate Mode'
  },
  [DatasetModeEnum.vague]: {
    iconLight: 'support/permission/publicLight',
    label: 'dataset.Mode.Vague Mode'
  }
};

export const PermissionTypeMap = {
  [PermissionTypeEnum.private]: {
    iconLight: 'support/permission/privateLight',
    label: 'permission.Private'
  },
  [PermissionTypeEnum.public]: {
    iconLight: 'support/permission/publicLight',
    label: 'permission.Public'
  }
};
