'use client';

import { useEffect, useState, useCallback } from 'react';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import type { IUser } from '@/types';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing, setEditing] = useState<IUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('Failed to delete user');
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      technician: 'bg-blue-100 text-blue-700 border-blue-200',
      user: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role] || colors.user;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and roles</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="technician">Technician</option>
          <option value="user">User</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">User</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Email</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Role</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-amber-900">Joined</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{u.name}</div>
                            {u._id === currentUser?._id && (
                              <span className="text-xs text-amber-600">(You)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleBadge(u.role)} capitalize`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setEditing(u)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={u._id === currentUser?._id}
                          className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u._id === currentUser?._id ? "Can't delete your own account" : 'Delete user'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl block mb-2">👥</span>
                <p>No users found</p>
              </div>
            )}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {(editing || showCreate) && (
        <UserModal
          user={editing}
          isCreate={showCreate}
          isSelf={editing?._id === currentUser?._id}
          onClose={() => { setEditing(null); setShowCreate(false); }}
          onSave={() => { setEditing(null); setShowCreate(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  isCreate,
  isSelf,
  onClose,
  onSave,
}: {
  user: IUser | null;
  isCreate: boolean;
  isSelf: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isCreate ? '/api/users' : `/api/users/${user!._id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const body: Record<string, string> = { name, email, role };
      if (password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        setError(data.error || 'Failed to save user');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isCreate ? 'Add New User' : `Edit ${user?.name}`}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {isCreate ? '' : '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isCreate}
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900"
              placeholder="Min 8 chars, uppercase, lowercase, number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as IUser['role'])}
              disabled={isSelf}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900 disabled:bg-gray-100"
            >
              <option value="user">User</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && (
              <p className="text-xs text-amber-600 mt-1">You cannot change your own role</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
