"use client";

import { useEffect, useState } from "react";

interface Device { id: string; qrCode: string; model: string; status: string; company: { name: string }; }
interface Company { id: string; name: string; }

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ qrCode: "", companyId: "", model: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/devices").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
    ]).then(([d, c]) => { setDevices(d); setCompanies(c); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const device = await res.json();
      setDevices((prev) => [{ ...device, company: companies.find((c) => c.id === device.companyId) ?? { name: "" } }, ...prev]);
      setForm({ qrCode: "", companyId: "", model: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">이동장치 관리</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">+ 장치 등록</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800">신규 장치 등록</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR코드 *</label>
              <input required value={form.qrCode} onChange={(e) => setForm({ ...form, qrCode: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="QR 스캔 값" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">업체 *</label>
              <select required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- 선택 --</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">모델명 *</label>
              <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="킥고잉 X1" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{saving ? "저장 중..." : "등록"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">취소</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center text-gray-400 py-12">로딩 중...</div> : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">QR코드</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">업체</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">모델</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.qrCode}</td>
                  <td className="px-4 py-3">{d.company.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.model}</td>
                  <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">운행중</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
