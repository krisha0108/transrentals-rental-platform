# Toast Notification Usage Guide

## Setup

1. Wrap your app with `ToastProvider` in the root layout:

```tsx
import { ToastProvider } from '@/components/ui/toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

## Usage in Components

```tsx
import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Your action was completed successfully',
      duration: 3000 // optional, default is 3000ms
    });
  };

  const handleError = () => {
    showToast({
      type: 'error',
      title: 'Error!',
      message: 'Something went wrong. Please try again.',
    });
  };

  const handleWarning = () => {
    showToast({
      type: 'warning',
      title: 'Warning!',
      message: 'Please check your input before proceeding.',
    });
  };

  const handleInfo = () => {
    showToast({
      type: 'info',
      title: 'Information',
      message: 'This is an informational message.',
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}
```

## Toast Types

- **success**: Green theme with checkmark icon
- **error**: Red theme with alert icon
- **warning**: Yellow theme with warning icon
- **info**: Blue theme with info icon

## Features

- ✅ Auto-dismiss after 3 seconds (customizable)
- ✅ Manual close button
- ✅ Progress bar showing remaining time
- ✅ Smooth slide-in and fade-out animations
- ✅ Stack multiple toasts
- ✅ Responsive design
- ✅ Large, attractive UI with gradient backgrounds
