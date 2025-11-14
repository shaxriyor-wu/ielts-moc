const Avatar = ({ name, email, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const initial = (name?.[0] || email?.[0] || 'U').toUpperCase();

  return (
    <div className={`${sizes[size]} bg-blue-600 rounded-full flex items-center justify-center text-white font-medium`}>
      {initial}
    </div>
  );
};

export default Avatar;

