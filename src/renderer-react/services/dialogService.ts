import { Modal } from 'antd';

interface DialogOptions {
  message: string;
  showCancel?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  title?: string;
}

const confirm = async (options: DialogOptions | string): Promise<boolean> => {
  const opts = typeof options === 'string' ? { message: options } : options;
  const { message, showCancel = true, cancelButtonText, confirmButtonText, title } = opts;

  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: title ?? message,
      content: title ? message : undefined,
      okText: confirmButtonText ?? '确认',
      cancelText: cancelButtonText ?? '取消',
      okCancel: showCancel,
      onOk: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });
  });
};

const dialog = async (options: DialogOptions | string): Promise<boolean> => {
  const opts = typeof options === 'string' ? { message: options } : options;
  return confirm({ ...opts, showCancel: opts.showCancel ?? false });
};

dialog.confirm = confirm;

const info = (message: string): void => {
  Modal.info({ content: message });
};

const warning = (message: string): void => {
  Modal.warning({ content: message });
};

const error = (message: string): void => {
  Modal.error({ content: message });
};

const success = (message: string): void => {
  Modal.success({ content: message });
};

export const dialogService = {
  confirm,
  dialog,
  error,
  info,
  success,
  warning,
};

export type { DialogOptions };
