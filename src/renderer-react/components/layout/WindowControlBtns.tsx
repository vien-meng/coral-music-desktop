import { CloseOutlined, CompressOutlined, ExpandOutlined, MinusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { appService } from '../../services/appService';

interface WindowControlBtnsProps {
  variant?: 'mac' | 'windows';
  isFullscreen?: boolean;
}

const diameter = 14;
const btnFontSize = 12;
const fontWeight = 600;

export const WindowControlBtns = ({
  variant = 'windows',
  isFullscreen = false,
}: WindowControlBtnsProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleFocus = (): void => {
      setIsHovering(false);
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (isFullscreen) return null;

  if (variant === 'mac') {
    return (
      <div
        className="coral-window-btns-mac"
        onMouseEnter={() => {
          setIsHovering(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
        }}
        style={
          {
            display: 'flex',
            gap: 8,
            padding: '0 12px',
            WebkitAppRegion: 'no-drag',
            zIndex: 999,
          } as React.CSSProperties
        }
      >
        <button
          aria-label="关闭"
          onClick={() => {
            appService.closeWindow();
          }}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: '50%',
            border: 'none',
            background: '#ff5f56',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
            fontSize: btnFontSize,
            opacity: isHovering ? 1 : 0.8,
            fontWeight,
          }}
        >
          {isHovering ? '×' : ''}
        </button>
        <button
          aria-label="最小化"
          onClick={() => {
            appService.minWindow();
          }}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: '50%',
            border: 'none',
            background: '#ffbd2e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
            fontSize: btnFontSize,
            opacity: isHovering ? 1 : 0.8,
            fontWeight,
          }}
        >
          {isHovering ? '−' : ''}
        </button>
        <button
          aria-label={isMaximized ? '还原' : '最大化'}
          onClick={() => {
            appService.maximizeWindow().then(setIsMaximized);
          }}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: '50%',
            border: 'none',
            background: '#27c93f',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
            fontSize: btnFontSize,
            opacity: isHovering ? 1 : 0.8,
            fontWeight,
          }}
        >
          {isHovering ? (isMaximized ? '◱' : '+') : ''}
        </button>
      </div>
    );
  }

  return (
    <div
      className="coral-window-btns-windows"
      style={{ display: 'flex', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        aria-label="最小化"
        onClick={() => {
          appService.minWindow();
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'transparent';
        }}
        style={{
          width: 46,
          height: 32,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-font)',
        }}
      >
        <MinusOutlined />
      </button>
      <button
        aria-label={isMaximized ? '还原' : '最大化'}
        onClick={() => {
          appService.maximizeWindow().then(setIsMaximized);
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'transparent';
        }}
        style={{
          width: 46,
          height: 32,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-font)',
        }}
      >
        {isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
      </button>
      <button
        aria-label="关闭"
        onClick={() => {
          appService.closeWindow();
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = '#ff5f56';
          event.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'transparent';
          event.currentTarget.style.color = 'var(--color-font)';
        }}
        style={{
          width: 46,
          height: 32,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-font)',
        }}
      >
        <CloseOutlined />
      </button>
    </div>
  );
};
