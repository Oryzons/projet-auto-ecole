'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  AppDialogView,
  type AppDialogVariant,
} from '@/components/ui/app-dialog';

type AlertOptions = {
  title: string;
  description?: string;
  variant?: AppDialogVariant;
  confirmLabel?: string;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  variant?: AppDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogRequest =
  | ({ type: 'alert' } & AlertOptions)
  | ({ type: 'confirm' } & ConfirmOptions);

type AppDialogContextValue = {
  showAlert: (options: AlertOptions | string) => Promise<void>;
  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

function normalizeAlertOptions(options: AlertOptions | string): AlertOptions {
  return typeof options === 'string' ? { title: options } : options;
}

function normalizeConfirmOptions(
  options: ConfirmOptions | string,
): ConfirmOptions {
  return typeof options === 'string' ? { title: options } : options;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const confirmedRef = useRef(false);

  const openDialog = useCallback((request: DialogRequest) => {
    setDialog(request);
    setVisible(true);
    confirmedRef.current = false;
  }, []);

  const showAlert = useCallback(
    (options: AlertOptions | string) =>
      new Promise<void>((resolve) => {
        resolveRef.current = () => resolve();
        openDialog({ type: 'alert', ...normalizeAlertOptions(options) });
      }),
    [openDialog],
  );

  const showConfirm = useCallback(
    (options: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        openDialog({ type: 'confirm', ...normalizeConfirmOptions(options) });
      }),
    [openDialog],
  );

  const requestClose = useCallback((confirmed: boolean) => {
    confirmedRef.current = confirmed;
    setVisible(false);
  }, []);

  const handleExitComplete = useCallback(() => {
    if (!dialog || !resolveRef.current) return;

    if (dialog.type === 'alert') {
      resolveRef.current(true);
    } else {
      resolveRef.current(confirmedRef.current);
    }

    resolveRef.current = null;
    setDialog(null);
  }, [dialog]);

  return (
    <AppDialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && (
        <AppDialogView
          open={visible}
          type={dialog.type}
          title={dialog.title}
          description={dialog.description}
          variant={dialog.variant}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.type === 'confirm' ? dialog.cancelLabel : undefined}
          onConfirm={() => requestClose(true)}
          onCancel={() => requestClose(false)}
          onExitComplete={handleExitComplete}
        />
      )}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return context;
}
