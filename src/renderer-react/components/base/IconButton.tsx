import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import type { ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonProps, 'icon'> {
  children?: ReactNode;
  min?: boolean;
  outline?: boolean;
}

export const IconButton = ({ children, min, outline, ...rest }: IconButtonProps) => (
  <Button
    size={min ? 'small' : 'middle'}
    type={outline ? 'default' : 'default'}
    ghost={outline}
    {...rest}
  >
    {children}
  </Button>
);
