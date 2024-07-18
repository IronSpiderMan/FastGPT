import { Box, Switch } from '@chakra-ui/react';
import React, { ChangeEvent } from 'react';
import Tag from '@/components/Tag';

interface DigitalHumanSwitchProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const DigitalHumanSwitch: React.FC<DigitalHumanSwitchProps> = ({ onChange }) => {
  return (
    <>
      <Box display="flex">
        <Tag mr={2}>
          <Box ml={1} mr={1}>
            开启数字人
          </Box>
          <Switch onChange={onChange} />
        </Tag>
      </Box>
    </>
  );
};
export default DigitalHumanSwitch;
