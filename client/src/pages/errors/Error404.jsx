import ErrorPage from './ErrorPage';
import { FileQuestion } from 'lucide-react';

const Error404 = () => {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved. Please check the URL and try again."
      icon={FileQuestion}
      showHomeButton={true}
      showBackButton={true}
      showRefreshButton={false}
    />
  );
};

export default Error404;

