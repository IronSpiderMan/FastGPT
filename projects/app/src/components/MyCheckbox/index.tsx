import React, { useRef, forwardRef, useMemo } from 'react';
import {
  Menu,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
  MenuButton,
  Box,
  Checkbox,
  css
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export type MyCheckboxProps = {
  value: any[]; // 支持多个选中的值
  list: { label: string | React.ReactNode; value: any }[];
  placeholder?: string;
  onChange: (val: any[]) => void;
  width?: string;
};

const MyCheckbox = (
  { placeholder, value, list, onChange, width = '100%', ...props }: MyCheckboxProps,
  ref: any
) => {
  const selectRef = useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toggleSelection = (itemValue: any) => {
    if (value.includes(itemValue)) {
      // 移除选中项
      onChange(value.filter((v) => v !== itemValue));
    } else {
      // 添加选中项
      onChange([...value, itemValue]);
    }
  };

  return (
    <Box
      css={css({
        '& div': {
          width: 'auto !important'
        }
      })}
    >
      <Menu
        autoSelect={false}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        strategy={'fixed'}
        matchWidth
      >
        <MenuButton
          as={Button}
          ref={selectRef}
          width={width}
          px={3}
          rightIcon={<ChevronDownIcon />}
          variant={'whitePrimary'}
          textAlign={'left'}
          _active={{ transform: 'none' }}
          {...(isOpen
            ? {
                boxShadow: '0px 0px 4px #A8DBFF',
                borderColor: 'primary.500'
              }
            : {})}
          {...props}
        >
          {placeholder}
        </MenuButton>

        <MenuList
          minW={(() => {
            const w = selectRef.current?.clientWidth;
            if (w) {
              return `${w}px !important`;
            }
            return Array.isArray(width)
              ? width.map((item) => `${item} !important`)
              : `${width} !important`;
          })()}
          w={'auto'}
          p={'6px'}
          border={'1px solid #fff'}
          boxShadow={
            '0px 2px 4px rgba(161, 167, 179, 0.25), 0px 0px 1px rgba(121, 141, 159, 0.25);'
          }
          zIndex={99}
          maxH={'40vh'}
          overflowY={'auto'}
        >
          {list.map((item) => (
            <MenuItem
              key={item.value}
              display={'flex'}
              alignItems={'center'}
              py={2}
              cursor={'pointer'}
              _hover={{ backgroundColor: 'myWhite.600' }}
              onClick={() => toggleSelection(item.value)}
              whiteSpace={'pre-wrap'}
              backgroundColor={value.includes(item.value) ? 'myWhite.300' : 'none'}
              color={value.includes(item.value) ? 'primary.500' : 'inherit'}
            >
              <Checkbox
                isChecked={value.includes(item.value)}
                onChange={() => toggleSelection(item.value)}
                mr={2}
              />
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default React.memo(forwardRef(MyCheckbox));
