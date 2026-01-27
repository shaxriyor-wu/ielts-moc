import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, GraduationCap } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const DemoLogin = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'admin',
      title: 'Admin',
      description: 'Create and manage tests, generate keys, and track student results',
      icon: <Users className="w-12 h-12" />,
      color: 'blue',
      path: '/admin/login',
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Enter test key and full name to start your exam',
      icon: <GraduationCap className="w-12 h-12" />,
      color: 'green',
      path: '/exam-access',
    },
  ];

  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
            CD IELTS EMPIRE
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your role to continue
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                hover
                onClick={() => navigate(role.path)}
                className="h-full flex flex-col"
              >
                <div className="text-center flex-1 flex flex-col items-center justify-center">
                  <div className={`w-20 h-20 ${colorClasses[role.color]} rounded-full flex items-center justify-center mb-6`}>
                    {role.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                    {role.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-1">
                    {role.description}
                  </p>
                  <Button className="w-full" variant="primary">
                    Login as {role.title}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>Demo Version - Select a role to access the platform</p>
        </motion.div>
      </div>
    </div>
  );
};

export default DemoLogin;
