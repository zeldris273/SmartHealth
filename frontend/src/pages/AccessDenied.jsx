
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 flex justify-center">
          <ShieldAlert className="w-20 h-20 text-white" />
        </div>
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Truy cập bị từ chối
          </h1>
          <p className="text-slate-500 mb-8 text-lg">
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-200"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
