import ErrorPage from './ErrorPage';
import { ServerCrash } from 'lucide-react';

const Error500 = () => {
  return (
    <ErrorPage
      statusCode={500}
      title="Internal Server Error"
      message="Something went wrong on our end. We're working to fix the issue. Please try again later."
      icon={ServerCrash}
      showHomeButton={true}
      showBackButton={true}
      showRefreshButton={true}
    />
  );
};

export default Error500;

