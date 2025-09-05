import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { LogEntry } from '../types';
import StatCard from './StatCard';
import { UsersIcon, BellIcon, ExclamationCircleIcon, DocumentTextIcon, ShieldCheckIcon } from './icons/AdminIcons';
import LogLevelChart from './charts/LogLevelChart';
import ActivityChart from './charts/ActivityChart'; // New chart for user activity

interface AdminDashboardProps {
  session: Session;
}

type SortKey = 'user' | 'actions' | 'lastSeen';
type SortDirection = 'asc' | 'desc';

// --- System Health Components ---
const LogLevelBadge = ({ level }: { level: LogEntry['level'] }) => {
  const levelStyles = {
    ERROR: 'bg-red-100 text-red-800 border-red-200',
    WARN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    INFO: 'bg-blue-100 text-blue-800 border-blue-200',
    DEBUG: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${levelStyles[level]}`}>
      {level}
    </span>
  );
};

const SystemHealthView: React.FC<{ logs: LogEntry[]; admins: { email: string }[]; fetchAdmins: () => Promise<void> }> = ({ logs, admins, fetchAdmins }) => {
  const [filterLevel, setFilterLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !/^\S+@\S+\.\S+$/.test(newAdminEmail)) {
      alert('Please enter a valid email address.');
      return;
    }
    const { error } = await supabase.from('admins').insert({ email: newAdminEmail });
    if (error) {
      alert(`Error adding admin: ${error.message}`);
    } else {
      setNewAdminEmail('');
      await fetchAdmins();
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email === 'vpi.sonnt@pvn.vn') {
      alert('Cannot remove the super admin.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${email} as an admin?`)) {
      const { error } = await supabase.from('admins').delete().eq('email', email);
      if (error) {
        alert(`Error removing admin: ${error.message}`);
      } else {
        await fetchAdmins();
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = !filterLevel || log.level === filterLevel;
      const matchesSearch = !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, filterLevel, searchTerm]);

  const stats = useMemo(() => {
    const allAdminEmails = ['vpi.sonnt@pvn.vn', ...admins.map(a => a.email)];
    const uniqueAdmins = new Set(allAdminEmails);
    return {
      totalLogs: logs.length,
      errors: logs.filter(log => log.level === 'ERROR').length,
      warnings: logs.filter(log => log.level === 'WARN').length,
      totalAdmins: uniqueAdmins.size,
    };
  }, [logs, admins]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DocumentTextIcon />} value={stats.totalLogs} label="Total Logs" color="blue" />
        <StatCard icon={<ExclamationCircleIcon />} value={stats.errors} label="Error Events" color="red" />
        <StatCard icon={<BellIcon />} value={stats.warnings} label="Warning Events" color="yellow" />
        <StatCard icon={<UsersIcon />} value={stats.totalAdmins} label="Administrators" color="indigo" />
      </div>

      {/* Charts & Admin Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Log Level Distribution</h3>
          <div className="flex-grow relative"><LogLevelChart logs={logs} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Manage Administrators</h3>
          <form onSubmit={handleAddAdmin} className="flex items-center gap-2 mb-4">
            <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="new.admin@example.com" className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" required />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Add Admin</button>
          </form>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            <div className="flex justify-between items-center p-2 bg-gray-100 rounded-md"><span className="font-semibold">vpi.sonnt@pvn.vn (Super Admin)</span></div>
            {admins.filter(admin => admin.email !== 'vpi.sonnt@pvn.vn').map(admin => (
              <div key={admin.email} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                <span>{admin.email}</span>
                <button onClick={() => handleRemoveAdmin(admin.email)} className="text-red-500 hover:text-red-700 font-semibold text-sm">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <option value="">All Levels</option><option value="ERROR">ERROR</option><option value="WARN">WARN</option><option value="INFO">INFO</option><option value="DEBUG">DEBUG</option>
          </select>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map(log => (
                <tr key={log.log_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono">{new Date(log.occurred_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><LogLevelBadge level={log.level} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-semibold">{log.source || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-800 break-words max-w-lg">{log.message}
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 font-medium">View Metadata</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded-md text-xs text-gray-700 border border-gray-200 overflow-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && <div className="text-center p-6 text-gray-500">No logs found matching your criteria.</div>}
        </div>
      </div>
    </div>
  );
};

// --- User Activity Components ---
const UserActivityView: React.FC<{ userLogs: LogEntry[] }> = ({ userLogs }) => {
    const [sortKey, setSortKey] = useState<SortKey>('actions');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const activityData = useMemo(() => {
        const userMetrics: { [email: string]: { email: string; actions: number; lastSeen: string; actionCounts: { [action: string]: number } } } = {};
        const dailyActivity: { [date: string]: number } = {};
        let mostActiveUser = { email: 'N/A', actions: 0 };
        let mostViewedProduct = { name: 'N/A', views: 0 };
        const productViews: { [name: string]: number } = {};

        userLogs.forEach(log => {
            const email = log.metadata?.userEmail;
            if (!email) return;

            if (!userMetrics[email]) {
                userMetrics[email] = { email, actions: 0, lastSeen: log.occurred_at, actionCounts: {} };
            }
            userMetrics[email].actions++;
            if (new Date(log.occurred_at) > new Date(userMetrics[email].lastSeen)) {
                userMetrics[email].lastSeen = log.occurred_at;
            }
            const action = log.metadata?.action || 'UNKNOWN';
            userMetrics[email].actionCounts[action] = (userMetrics[email].actionCounts[action] || 0) + 1;
            
            const date = new Date(log.occurred_at).toISOString().split('T')[0];
            dailyActivity[date] = (dailyActivity[date] || 0) + 1;

            if (action === 'ACCESS_INITIATIVE' || action === 'VIEW_DATABASES') {
                 const productName = log.metadata?.initiativeName;
                 if(productName) {
                    productViews[productName] = (productViews[productName] || 0) + 1;
                 }
            }
        });

        Object.values(userMetrics).forEach(user => {
            if (user.actions > mostActiveUser.actions) {
                mostActiveUser = user;
            }
        });

        Object.entries(productViews).forEach(([name, views]) => {
            if (views > mostViewedProduct.views) {
                mostViewedProduct = { name, views };
            }
        });

        const sortedUsers = Object.values(userMetrics).map(user => {
            const commonAction = Object.entries(user.actionCounts).sort((a, b) => b[1] - a[1])[0];
            return { ...user, commonAction: commonAction ? commonAction[0] : 'N/A' };
        });

        return {
            uniqueUsers: Object.keys(userMetrics).length,
            totalActions: userLogs.length,
            userMetrics: sortedUsers,
            dailyActivity,
            mostActiveUser,
            mostViewedProduct,
        };
    }, [userLogs]);

    const sortedUserMetrics = useMemo(() => {
        return [...activityData.userMetrics].sort((a, b) => {
            let valA, valB;
            switch(sortKey) {
                case 'lastSeen':
                    valA = new Date(a.lastSeen).getTime();
                    valB = new Date(b.lastSeen).getTime();
                    break;
                case 'user':
                    valA = a.email;
                    valB = b.email;
                    break;
                case 'actions':
                default:
                    valA = a.actions;
                    valB = b.actions;
                    break;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activityData.userMetrics, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const SortableHeader: React.FC<{ title: string; sortKeyName: SortKey }> = ({ title, sortKeyName }) => (
        <th onClick={() => handleSort(sortKeyName)} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
            <div className="flex items-center">
                <span>{title}</span>
                {sortKey === sortKeyName && <span className="ml-1">{sortDirection === 'desc' ? '↓' : '↑'}</span>}
            </div>
        </th>
    );

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<UsersIcon />} value={activityData.uniqueUsers} label="Unique Users" color="blue" />
            <StatCard icon={<DocumentTextIcon />} value={activityData.totalActions} label="Total Actions" color="indigo" />
            <StatCard icon={<ShieldCheckIcon />} value={activityData.mostActiveUser.email} label="Most Active User" color="green" />
            <StatCard icon={<BellIcon />} value={activityData.mostViewedProduct.name} label="Most Viewed Product" color="yellow" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md h-96 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Over Time (Last 30 days)</h3>
                <div className="flex-grow relative"><ActivityChart activityData={activityData.dailyActivity} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md h-96 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Activity by User</h3>
                <div className="overflow-y-auto flex-grow">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <SortableHeader title="User" sortKeyName="user" />
                                <SortableHeader title="Total Actions" sortKeyName="actions" />
                                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Most Common Action</th>
                                <SortableHeader title="Last Seen" sortKeyName="lastSeen" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {sortedUserMetrics.map(user => (
                               <tr key={user.email} className="hover:bg-gray-50">
                                   <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">{user.email}</td>
                                   <td className="px-4 py-3 text-center">{user.actions}</td>
                                   <td className="px-4 py-3"><LogLevelBadge level={user.commonAction.includes('DELETE') ? 'ERROR' : 'INFO'} /></td>
                                   <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono">{new Date(user.lastSeen).toLocaleString()}</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    );
};


// --- Main Admin Dashboard Component ---
const AdminDashboard: React.FC<AdminDashboardProps> = ({ session }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [admins, setAdmins] = useState<{ email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('user'); // Default to new user tab

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(2000); 

    if (error) {
      setError(`Failed to fetch logs: ${error.message}`);
      setLogs([]);
    } else {
      setLogs(data as LogEntry[]);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  const fetchAdmins = useCallback(async () => {
    const { data, error } = await supabase.from('admins').select('email');
    if (error) {
      setError(`Failed to fetch admins: ${error.message}`);
    } else {
      setAdmins(data || []);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchAdmins();
  }, [fetchLogs, fetchAdmins]);
  
  const userLogs = useMemo(() => logs.filter(log => log.source === 'UserInteraction'), [logs]);

  if (isLoading) {
    return <div className="text-center p-8">Loading admin data...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  const TabButton = ({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) => (
      <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
          {children}
      </button>
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
            <TabButton isActive={activeTab === 'user'} onClick={() => setActiveTab('user')}>User Activity</TabButton>
            <TabButton isActive={activeTab === 'system'} onClick={() => setActiveTab('system')}>System Health</TabButton>
        </div>
        
        {activeTab === 'user' && <UserActivityView userLogs={userLogs} />}
        {activeTab === 'system' && <SystemHealthView logs={logs} admins={admins} fetchAdmins={fetchAdmins} />}
    </div>
  );
};

export default AdminDashboard;