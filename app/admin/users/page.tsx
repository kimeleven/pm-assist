"use client";

import { useEffect, useState } from "react";
import { Role } from "@prisma/client";

interface User {
  id: string;
  username: string;
  role: Role;
  company?: { name: string };
  createdAt: string;
}

interface Company { id: string; name: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "ADMIN", companyId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
    ]).then(([u, c]) => { setUsers(u); setCompanies(c); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setUsers((prev) => [data, ...prev]);
      setForm({ username: "", password: "", role: "ADMIN", companyId: "" });
      setShowForm(false);
    } else {
      setError(data.error ?? "생성 실패");
    }
  }

  const roleLabel: Record<Role, string> = { ADMIN: "공무원(관리자)", COMPANY: "PM업체" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">계정 관리</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + 계정 생성
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800">신규 계정 생성</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">아이디 *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">비밀번호 *</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">역할 *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ADMIN">공무원(관리자)</option>
                <option value="COMPANY">PM업체</option>
              </select>
            </div>
            {form.role === "COMPANY" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">소속 업체</label>
                <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- 선택 --</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{saving ? "저장 중..." : "생성"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">취소</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center text-gray-400 py-12">로딩 중...</div> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">아이디</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">역할</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">소속 업체</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">생성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.company?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
