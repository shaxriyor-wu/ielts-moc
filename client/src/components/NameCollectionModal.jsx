import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { User, ArrowRight } from 'lucide-react';

const NameCollectionModal = ({ isOpen, onSubmit, testCode }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }

        if (!lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // Prevent closing without submitting
            title="Enter Your Details"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Welcome Message */}
                <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Welcome to the IELTS Mock Test
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Please enter your name to begin
                    </p>
                    {testCode && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Test Code: <span className="font-mono font-bold">{testCode}</span>
                        </p>
                    )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                if (errors.firstName) {
                                    setErrors(prev => ({ ...prev, firstName: null }));
                                }
                            }}
                            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.firstName
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="Enter your first name"
                            autoComplete="given-name"
                            autoFocus
                        />
                        {errors.firstName && (
                            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                if (errors.lastName) {
                                    setErrors(prev => ({ ...prev, lastName: null }));
                                }
                            }}
                            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.lastName
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="Enter your last name"
                            autoComplete="family-name"
                        />
                        {errors.lastName && (
                            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                        )}
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Note:</strong> After you submit your name, you will have
                        <strong className="text-blue-900 dark:text-blue-200"> 1 minute </strong>
                        to prepare before the test begins.
                    </p>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={!isValid || isSubmitting}
                    loading={isSubmitting}
                >
                    Continue to Test
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </form>
        </Modal>
    );
};

export default NameCollectionModal;
