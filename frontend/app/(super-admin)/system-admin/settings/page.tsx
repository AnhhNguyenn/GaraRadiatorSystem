"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string;
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/v1/system-admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = settings.map(s => ({ settingKey: s.settingKey, settingValue: s.settingValue }));

      const res = await fetch("http://localhost:5000/api/v1/system-admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Đã lưu và xóa Cache RAM thành công!");
      } else {
        toast.error("Cập nhật thất bại");
      }
    } catch (err) {
      toast.error("Lỗi hệ thống");
    }
  };

  const handleChange = (key: string, val: string) => {
    setSettings(prev => prev.map(s => s.settingKey === key ? { ...s, settingValue: val } : s));
  };

  if (loading) return <div className="p-8">Đang tải cấu hình lõi...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Admin - Cấu hình Động</h1>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Lưu & Clear Cache
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium border-b pb-2 mb-4">Các tham số hệ thống</h2>
        <div className="space-y-6">
          {settings.map(setting => (
            <div key={setting.id} className="grid grid-cols-3 gap-4 items-center">
              <div className="col-span-1 text-sm font-medium text-gray-700">
                {setting.settingKey}
                <div className="text-xs text-gray-500">{setting.description}</div>
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={setting.settingValue}
                  onChange={e => handleChange(setting.settingKey, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
