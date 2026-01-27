import toast, { Toaster } from 'react-hot-toast';

export const showToast = (message, type = 'success') => {
  switch (type) {
    case 'success':
      toast.success(message, {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      break;
    case 'error':
      toast.error(message, {
        duration: 4000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
      break;
    case 'info':
      toast(message, {
        duration: 3000,
        icon: 'ℹ️',
      });
      break;
    default:
      toast(message);
  }
};

export const ToastContainer = () => (
  <Toaster 
    position="top-right" 
    toastOptions={{
      duration: 3000,
      style: {
        background: '#363636',
        color: '#fff',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      },
      error: {
        duration: 4000,
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
);

export default showToast;
