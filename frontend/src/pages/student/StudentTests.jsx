import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Play, Crown, Headphones, PenTool, Mic, FileText,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import VariantPreviewModal from './VipVariantPreview';

const StudentTests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vipVariants, setVipVariants] = useState(null);
  const [activeTab, setActiveTab] = useState('listening');
  const [previewVariant, setPreviewVariant] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsRes, vipRes] = await Promise.all([
        studentApi.getAllTests().catch(() => ({ data: [] })),
        studentApi.getVipVariants().catch(() => ({ data: { variants: null } })),
      ]);
      setTests(testsRes.data || []);
      setVipVariants(vipRes.data?.variants || null);
    } catch (error) {
      showToast('Ma\'lumotlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTest = async (testCode) => {
    try {
      const response = await studentApi.enterTestCode(testCode);
      if (response.data.status === 'waiting') {
        showToast('Test boshlanishini kutib turing...', 'info');
        checkTestStatus();
      } else {
        navigate(`/exam/${testCode}`);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to join test', 'error');
    }
  };

  const checkTestStatus = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await studentApi.checkQueueStatus();
        if (response.data.status === 'preparation' || response.data.status === 'started') {
          clearInterval(interval);
          showToast('Test boshlandi!', 'success');
          navigate(`/exam/${response.data.variant_code || ''}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          showToast('Test hali boshlanmadi', 'warning');
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 2000);
  };

  const handleWorkVariant = (sectionType, sectionName, filename) => {
    setPreviewVariant({ sectionType, sectionName, filename });
    setShowPreview(true);
  };

  const tabs = [
    { id: 'listening', label: 'Listening', icon: Headphones, color: 'blue' },
    { id: 'reading', label: 'Reading', icon: BookOpen, color: 'green' },
    { id: 'writing', label: 'Writing', icon: PenTool, color: 'purple' },
    { id: 'speaking', label: 'Speaking', icon: Mic, color: 'orange' },
  ];

  const sectionConfig = {
    listening: { subsections: [1, 2, 3, 4], prefix: 'section', label: 'Section' },
    reading: { subsections: [1, 2, 3], prefix: 'passage', label: 'Passage' },
    writing: { subsections: [1, 2], prefix: 'task', label: 'Task' },
    speaking: { subsections: [1, 2, 3], prefix: 'part', label: 'Part' },
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
    },
  };

  const renderVipSection = (tabId) => {
    if (!vipVariants?.[tabId]) return null;

    const config = sectionConfig[tabId];
    const tab = tabs.find((t) => t.id === tabId);
    const Icon = tab.icon;
    const colors = colorClasses[tab.color];

    return (
      <div className="space-y-4">
        {config.subsections.map((num) => {
          const key = `${config.prefix}${num}`;
          const data = vipVariants[tabId][key];
          const count = data?.count || 0;
          const files = data?.files || [];

          return (
            <Card key={num} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {config.label} {num}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {count} variant{count !== 1 ? 'lar' : ''} mavjud
                  </p>
                </div>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((filename, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {filename}
                          </span>
                        </div>
                        <button
                          onClick={() => handleWorkVariant(tabId, key, filename)}
                          className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                          title="Ishlash"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Ishlash
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {config.label} {num} uchun variantlar mavjud emas
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) return <Loader fullScreen />;

  const isVip = user?.is_vip && vipVariants;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Tests</h2>
        {isVip && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" />
            VIP
          </span>
        )}
      </div>

      {/* VIP Variants Section */}
      {isVip && (
        <>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  VIP Variantlar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Barcha variantlarga kirish imkoniyati
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${
                          activeTab === tab.id
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </Card>

          <div className="mt-6">
            {renderVipSection(activeTab)}
          </div>

          {/* Preview Modal */}
          <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title="Variant"
            size="2xl"
          >
            {previewVariant && (
              <VariantPreviewModal
                sectionType={previewVariant.sectionType}
                sectionName={previewVariant.sectionName}
                filename={previewVariant.filename}
                onClose={() => setShowPreview(false)}
              />
            )}
          </Modal>
        </>
      )}

      {/* Regular Tests (non-VIP or additional tests) */}
      {!isVip && (
        <>
          {tests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Hozircha testlar mavjud emas</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {tests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                            {test.name}
                          </h3>
                          {test.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {test.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{test.duration_minutes || 180} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.is_active ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleJoinTest(test.code)}
                      disabled={!test.code}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {test.is_active ? 'Start Test' : 'Join Test'}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentTests;
