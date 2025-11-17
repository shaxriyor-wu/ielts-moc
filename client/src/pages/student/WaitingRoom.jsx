import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader as LoaderIcon,
  Play,
  RefreshCw,
  TimerReset,
  UsersRound,
  X,
} from 'lucide-react';
import { showToast } from '../../components/Toast';

const PREPARATION_DURATION = 60;
const WAITING_LIMIT_MINUTES = 10;

const STATUS_STEPS = [
  {
    key: 'waiting',
    title: 'In Queue',
    description: 'You have entered the queue and are waiting for activation.',
  },
  {
    key: 'assigned',
    title: 'Variant Assigned',
    description: 'Your mock variant has been assigned. Preparation will start soon.',
  },
  {
    key: 'preparation',
    title: 'Preparation',
    description: 'Use this minute to prepare before the test starts.',
  },
  {
    key: 'started',
    title: 'Test Started',
    description: 'Navigate to the Listening section to begin.',
  },
];

const STATUS_STYLES = {
  waiting: {
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
    accent: 'bg-yellow-500',
    icon: Clock,
  },
  assigned: {
    badge: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200',
    accent: 'bg-blue-500',
    icon: UsersRound,
  },
  preparation: {
    badge: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-200',
    accent: 'bg-purple-500',
    icon: TimerReset,
  },
  started: {
    badge: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200',
    accent: 'bg-green-500',
    icon: CheckCircle2,
  },
  timeout: {
    badge: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
    accent: 'bg-red-500',
    icon: AlertTriangle,
  },
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const WaitingRoom = ({ queueStatus, onStatusUpdate, onStartTest }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(queueStatus?.status || 'waiting');
  const [preparationTime, setPreparationTime] = useState(
    queueStatus?.preparation_time_remaining ?? PREPARATION_DURATION
  );
  const [waitingTime, setWaitingTime] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (queueStatus?.status) {
      setStatus(queueStatus.status);
    }
  }, [queueStatus?.status]);

  useEffect(() => {
    if (typeof queueStatus?.preparation_time_remaining === 'number') {
      setPreparationTime(queueStatus.preparation_time_remaining);
    }
  }, [queueStatus?.preparation_time_remaining]);

  const joinedAt = queueStatus?.joined_at;
  const autoStartAt = queueStatus?.auto_start_at;
  const timeoutDeadline = queueStatus?.timeout_deadline;
  const canStart = queueStatus?.can_start;
  const statusMeta = STATUS_STYLES[status] || STATUS_STYLES.waiting;
  const StatusIcon = statusMeta.icon || Clock;

  const handleStartTest = useCallback(
    async (manual = false) => {
      if (isStarting) return;
      setIsStarting(true);
      try {
        const response = await studentApi.startTest();
        const payload = response.data;
        onStartTest(payload);
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to start test';
        if (manual) {
          showToast(errorMessage, 'error');
        }
        // For automatic retries, we silently re-check status
      } finally {
        setIsStarting(false);
      }
    },
    [isStarting, onStartTest]
  );

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await studentApi.checkQueueStatus();
        const newStatus = response.data.status;
        setStatus(newStatus);
        onStatusUpdate(response.data);

        if (newStatus === 'timeout') {
          showToast(
            response.data.message ||
              'Test did not start within 10 minutes. You have been removed from the queue.',
            'error'
          );
          navigate('/student/dashboard', { replace: true });
          return;
        }

        if (newStatus === 'started' || response.data.can_start) {
          handleStartTest(false);
        }
      } catch (error) {
        console.error('Failed to check queue status:', error);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    checkStatus();

    return () => clearInterval(interval);
  }, [handleStartTest, navigate, onStatusUpdate]);

  useEffect(() => {
    if (!joinedAt || ['started', 'left', 'timeout'].includes(status)) {
      setWaitingTime(0);
      return;
    }

    const updateWaiting = () => {
      const now = Date.now();
      const joined = new Date(joinedAt).getTime();
      const minutesWaiting = (now - joined) / (1000 * 60);
      setWaitingTime(Math.max(0, Math.floor(minutesWaiting)));
    };

    updateWaiting();
    const interval = setInterval(updateWaiting, 1000);
    return () => clearInterval(interval);
  }, [joinedAt, status]);

  useEffect(() => {
    if (status !== 'preparation') return;
    if (preparationTime <= 0) {
      handleStartTest(false);
      return;
    }

    const timer = setInterval(() => {
      setPreparationTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [status, preparationTime, handleStartTest]);

  const handleLeave = async () => {
    try {
      await studentApi.leaveQueue();
      showToast('Left queue successfully', 'info');
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to leave queue', 'error');
    }
  };

  const waitingProgress = Math.min(100, (waitingTime / WAITING_LIMIT_MINUTES) * 100);
  const preparationProgress = Math.min(
    100,
    ((PREPARATION_DURATION - preparationTime) / PREPARATION_DURATION) * 100
  );

  const currentStepIndex = useMemo(() => {
    const idx = STATUS_STEPS.findIndex((step) => step.key === status);
    return idx === -1 ? 0 : idx;
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-3xl w-full relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20">
          <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full ${statusMeta.accent}`} />
        </div>

        <div className="relative space-y-8 p-6 md:p-10">
          {(status === 'waiting' || status === 'assigned' || status === 'preparation') && (
            <div className="absolute top-6 right-6 flex gap-3">
              <Button
                onClick={async () => {
                  try {
                    setRefreshing(true);
                    const response = await studentApi.checkQueueStatus();
                    setStatus(response.data.status);
                    onStatusUpdate(response.data);
                  } catch (error) {
                    showToast('Failed to refresh status', 'error');
                  } finally {
                    setRefreshing(false);
                  }
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                loading={refreshing}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={handleLeave}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Leave
              </Button>
            </div>
          )}

          <div className="text-center space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusMeta.badge}`}
            >
              <StatusIcon className="w-4 h-4" />
              {queueStatus?.status_label || status.toUpperCase()}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {queueStatus?.status_label || 'Waiting Room'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {queueStatus?.status_description || 'Please stay ready. Your test will begin shortly.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoTile
              label="Test Code"
              value={queueStatus?.test_code || '--'}
              icon={Activity}
            />
            <InfoTile
              label="Assigned Variant"
              value={queueStatus?.assigned_variant_name || 'Pending'}
              icon={UsersRound}
            />
            <InfoTile
              label="Joined Queue"
              value={joinedAt ? formatDateTime(joinedAt) : '--'}
              icon={Clock}
            />
            <InfoTile
              label="Auto Start"
              value={autoStartAt ? formatDateTime(autoStartAt) : 'Waiting'}
              icon={TimerReset}
            />
          </div>

          {(status === 'waiting' || status === 'assigned') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Waiting time</span>
                <span>
                  {waitingTime} / {WAITING_LIMIT_MINUTES} minutes
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full ${statusMeta.accent}`}
                  style={{ width: `${waitingProgress}%` }}
                />
              </div>
              {timeoutDeadline && (
                <p className="text-xs text-gray-500">
                  You will be removed at {formatDateTime(timeoutDeadline)} if the test does not start.
                </p>
              )}
            </div>
          )}

          {status === 'preparation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Preparation Timer
                  </p>
                  <p className="text-4xl font-mono font-bold text-primary-600 dark:text-primary-400">
                    {formatDuration(preparationTime)}
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-primary-500"
                  style={{ width: `${preparationProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                The test will start automatically when the timer reaches 0.
              </p>
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleStartTest(true)}
                disabled={!canStart || isStarting}
                loading={isStarting}
              >
                <Play className="w-4 h-4" />
                Start Test Now
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Progress
            </h3>
            <div className="space-y-3">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = step.key === status;
                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      isActive
                        ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div
                      className={`mt-1 w-2 h-2 rounded-full ${
                        isCompleted
                          ? 'bg-green-500'
                          : isActive
                          ? statusMeta.accent
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const InfoTile = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default WaitingRoom;

