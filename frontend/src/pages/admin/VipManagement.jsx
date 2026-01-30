import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { Crown, Search, UserPlus, UserMinus, Users, X } from 'lucide-react';

const VipManagement = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [vipUsers, setVipUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(null);
  const [removingUser, setRemovingUser] = useState(null);

  useEffect(() => {
    loadVipUsers();
  }, []);

  const loadVipUsers = async () => {
    try {
      const response = await adminApi.getVipUsers();
      setVipUsers(response.data);
    } catch (error) {
      showToast('VIP foydalanuvchilarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const searchUsers = useCallback(
    debounce(async (query) => {
      if (query.length < 1) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const response = await adminApi.searchUsersForVip(query);
        setSearchResults(response.data);
      } catch (error) {
        showToast('Qidirishda xatolik', 'error');
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchUsers(value);
  };

  const handleAddVip = async (username) => {
    setAddingUser(username);
    try {
      await adminApi.addVipUser(username);
      showToast(`${username} ga VIP dostup berildi`, 'success');
      setSearchResults((prev) => prev.filter((u) => u.username !== username));
      await loadVipUsers();
    } catch (error) {
      showToast(error.response?.data?.error || 'VIP qo\'shishda xatolik', 'error');
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemoveVip = async (userId, username) => {
    setRemovingUser(userId);
    try {
      await adminApi.removeVipUser(userId);
      showToast(`${username} dan VIP olib tashlandi`, 'success');
      setVipUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      showToast(error.response?.data?.error || 'VIP olib tashlashda xatolik', 'error');
    } finally {
      setRemovingUser(null);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                VIP Boshqaruv
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                VIP foydalanuvchilarni boshqaring va yangi VIP dostup bering
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'add'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              VIP Qo'shish
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              VIP Foydalanuvchilar
              {vipUsers.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                  {vipUsers.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'add' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            VIP User Qo'shish
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Username bo'yicha qidirib, foydalanuvchiga VIP dostup bering. VIP foydalanuvchilar barcha variantlarga test kalitisiz kirish imkoniga ega bo'ladi.
          </p>

          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Username bo'yicha qidiring..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searching && (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              "{searchQuery}" bo'yicha hech qanday foydalanuvchi topilmadi
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    loading={addingUser === user.username}
                    disabled={addingUser === user.username}
                    onClick={() => handleAddVip(user.username)}
                  >
                    <Crown className="w-4 h-4" />
                    VIP Berish
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            VIP Foydalanuvchilar
          </h2>

          {vipUsers.length === 0 ? (
            <div className="text-center py-12">
              <Crown className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Hozircha VIP foydalanuvchilar yo'q
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                "VIP Qo'shish" bo'limidan foydalanuvchi qo'shing
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {vipUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                        {user.email && ` | ${user.email}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Ro'yxatdan o'tgan: {new Date(user.date_joined).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={removingUser === user.id}
                    disabled={removingUser === user.id}
                    onClick={() => handleRemoveVip(user.id, user.username)}
                  >
                    <UserMinus className="w-4 h-4" />
                    VIP Olib Tashlash
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default VipManagement;
