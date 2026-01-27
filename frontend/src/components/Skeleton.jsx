const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 bg-gray-200 dark:bg-gray-700 rounded',
    title: 'h-6 bg-gray-200 dark:bg-gray-700 rounded',
    card: 'h-32 bg-gray-200 dark:bg-gray-700 rounded-lg',
    avatar: 'w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full',
    button: 'h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded',
  };

  return (
    <div className={`animate-pulse ${variants[variant]} ${className}`} />
  );
};

export const SkeletonLoader = ({ count = 3, variant = 'text' }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
};

export default Skeleton;

