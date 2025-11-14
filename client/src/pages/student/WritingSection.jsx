import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import { useExam } from '../../context/ExamContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import Card from '../../components/Card';

const WritingSection = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { examData, answers, updateAnswer } = useExam();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (answers.writing?.content) {
      setContent(answers.writing.content);
    }
    setLoading(false);
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, []);

  const autoSave = async () => {
    try {
      await studentApi.saveWriting(content);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleContentChange = (value) => {
    setContent(value);
    updateAnswer('writing', 'content', value);
    studentApi.saveWriting(value).catch(console.error);
  };

  if (loading) return <Loader fullScreen />;

  const writingTasks = examData?.writing?.tasks || examData?.writing || [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {writingTasks.map((task, idx) => (
            <Card key={idx} className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Writing Task {idx + 1}
              </h3>
              <div 
                className="prose max-w-none mb-4 dark:prose-invert" 
                dangerouslySetInnerHTML={{ __html: task.content || task || '' }} 
              />
            </Card>
          ))}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Answer</h3>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={handleContentChange}
              style={{ minHeight: '400px' }}
              className="dark:bg-gray-800"
            />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Navigation</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/exam/${key}/listening`)}>
                Previous: Listening
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/exam/${key}/answer-sheet`)}>
                Review Answers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WritingSection;
