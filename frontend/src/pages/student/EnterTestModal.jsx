import { useState } from 'react';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Key } from 'lucide-react';

const EnterTestModal = ({ isOpen, onClose, onSubmit }) => {
  const [testCode, setTestCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!testCode || testCode.length !== 6) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(testCode);
      setTestCode('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTestCode(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Test Code">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Code (6 digits)
          </label>
          <Input
            type="text"
            value={testCode}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest"
            autoFocus
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enter the 6-digit code provided by your instructor
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={testCode.length !== 6 || loading} loading={loading}>
            <Key className="w-4 h-4 mr-2" />
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EnterTestModal;

