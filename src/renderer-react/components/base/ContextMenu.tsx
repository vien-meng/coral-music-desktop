import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

export interface MenuItem {
  action: string;
  name: string;
  hide?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
}

interface ContextMenuProps {
  menus: MenuItem[];
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onMenuClick: (item: MenuItem | null) => void;
  children: ReactNode;
  trigger?: 'contextMenu' | 'click' | 'hover';
  placement?: 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
}

export const ContextMenu = ({
  menus,
  visible,
  onVisibleChange,
  onMenuClick,
  children,
  trigger = 'contextMenu',
  placement = 'bottomLeft',
}: ContextMenuProps) => {
  const items: MenuProps['items'] = menus
    .filter((item) => !item.hide)
    .map((item) => ({
      key: item.action,
      label: item.name,
      disabled: item.disabled,
      onClick: () => {
        onMenuClick(item);
      },
    }));

  return (
    <Dropdown
      menu={{ items }}
      trigger={[trigger]}
      open={visible}
      onOpenChange={onVisibleChange}
      placement={placement}
    >
      {children}
    </Dropdown>
  );
};
