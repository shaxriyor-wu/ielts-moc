import ErrorPage from './ErrorPage';
import { AlertTriangle } from 'lucide-react';

const Error400 = () => {
  return (
    <ErrorPage
      statusCode={400}
      title="Bad Request"
      message="The request you sent was invalid or malformed. Please check your input and try again."
      icon={AlertTriangle}
      showHomeButton={true}
      showBackButton={true}
      showRefreshButton={false}
    />
  );
};

export default Error400;

