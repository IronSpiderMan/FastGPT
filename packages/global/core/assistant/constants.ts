export enum AssistantFieldEnum {
  wetProcess = '湿法',
  thinFilm = '薄膜',
  etching = '刻蚀',
  lithography = '光刻',
  metrology = '量测',
  administration = '行政',
  bonding = '键合'
}

export const AssistantFields = [
  { label: AssistantFieldEnum.wetProcess, value: AssistantFieldEnum.wetProcess },
  { label: AssistantFieldEnum.thinFilm, value: AssistantFieldEnum.thinFilm },
  { label: AssistantFieldEnum.etching, value: AssistantFieldEnum.etching },
  { label: AssistantFieldEnum.lithography, value: AssistantFieldEnum.lithography },
  { label: AssistantFieldEnum.metrology, value: AssistantFieldEnum.metrology },
  { label: AssistantFieldEnum.administration, value: AssistantFieldEnum.administration },
  { label: AssistantFieldEnum.bonding, value: AssistantFieldEnum.bonding }
];
