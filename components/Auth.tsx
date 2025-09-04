import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Sử dụng client Supabase duy nhất

const FINAL_REDIRECT_URL = 'https://catalog-app-version2-110937670224.us-west1.run.app';

const Auth: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalErrorDetails, setTechnicalErrorDetails] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Phân tích lỗi từ URL khi component được mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const getParam = (name: string) => params.get(name) || hashParams.get(name);

    const errorDescription = getParam('error_description');

    if (errorDescription) {
      const decodedError = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      
      if (decodedError.includes('Error getting user email from external provider')) {
        setErrorMessage(`**Nguyên nhân gốc rễ:** Ứng dụng của bạn trên Azure AD chưa được **phê duyệt** quyền truy cập vào email người dùng.

**Cách khắc phục DỨT ĐIỂM:**
1.  Mở trang **Azure AD** > **App registrations** > ứng dụng của bạn.
2.  Vào mục **API permissions**.
3.  **KIỂM TRA CỘT "STATUS":** Tìm các quyền \`email\` và \`User.Read\`. Cột "Status" bên cạnh chúng phải hiển thị **dấu tick màu xanh lá cây** và có chữ **"Granted for..."**.
4.  **NẾU KHÔNG CÓ DẤU TICK XANH:** Nhấn nút **"Grant admin consent for [Tên tổ chức]"** ở phía trên danh sách. Nút này phải được nhấn bởi một quản trị viên.

Sau khi tất cả các quyền cần thiết đều có dấu tick xanh, lỗi này sẽ được giải quyết. Vấn đề này nằm ở cấu hình Azure, không phải lỗi mã nguồn.`);
      } else if (decodedError.includes('AADSTS9002325')) {
          setErrorMessage(`Lỗi cấu hình xác thực. Có sự không khớp giữa loại ứng dụng trên Azure AD và cài đặt trên Supabase. Vui lòng kiểm tra kỹ:
1) Trên Azure AD: Ứng dụng phải được đăng ký dưới nền tảng "Web" (XÓA nền tảng "SPA" nếu có).
2) Trên Supabase: Trường "Secret Value" phải được điền chính xác với giá trị đã tạo trên Azure AD.`);
      } else {
          setErrorMessage(`Lỗi đăng nhập: ${decodedError}.`);
      }
      
      const details: Record<string, string> = {};
      const errorKeys = ['error', 'error_description', 'error_codes', 'timestamp', 'trace_id', 'correlation_id'];
      errorKeys.forEach(key => {
          const value = getParam(key);
          if (value) {
              details[key] = decodeURIComponent(value.replace(/\+/g, ' '));
          }
      });

      if (Object.keys(details).length > 0) {
          setTechnicalErrorDetails(details);
      }

      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);


  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTechnicalErrorDetails(null);

    // Sử dụng client Supabase duy nhất
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: FINAL_REDIRECT_URL,
        scopes: 'email openid profile User.Read',
      },
    });

    if (error) {
      console.error('Error initiating login:', error.message);
      setErrorMessage(`Lỗi đăng nhập: ${error.message}.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4 relative">
        <div className="w-full max-w-md mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
                <img src="https://i.ibb.co/nMdwMV4S/pvn-log.png" alt="Logo PetroVietnam" className="h-24" />
            </div>

            {/* Titles */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0A2259] mb-2">Hệ thống quản lý ứng dụng số PetroVietnam</h1>
                <p className="text-gray-600">Đăng nhập để sử dụng hệ thống</p>
            </div>

            {/* Login Section */}
            <div className="w-full">
                <h2 className="text-lg font-semibold text-center mb-4">Đăng nhập với tài khoản Microsoft</h2>
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full inline-flex justify-center items-center px-6 py-3 bg-[#0A2259] text-white font-semibold rounded-lg shadow-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang chuyển hướng...
                        </>
                    ) : (
                        <>
                             <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.53 21.5H3.5V13.47H11.53V21.5M20.5 21.5H12.47V13.47H20.5V21.5M11.53 12.53H3.5V4.5H11.53V12.53M20.5 12.53H12.47V4.5H20.5V12.53Z"></path></svg>
                            Đăng nhập với Microsoft
                        </>
                    )}
                </button>
                {errorMessage && (
                    <div className="mt-6 text-sm text-left text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
                        <p className="font-semibold">Đã xảy ra sự cố</p>
                        <p className="mt-1 whitespace-pre-wrap">{errorMessage}</p>
                        {technicalErrorDetails && (
                            <details className="mt-3" open>
                                <summary className="cursor-pointer font-medium text-xs text-gray-600 hover:text-gray-800">
                                    Chi tiết kỹ thuật
                                </summary>
                                <div className="mt-2 p-2 bg-red-50 rounded-md text-xs text-gray-700 border border-red-100">
                                    <ul className="space-y-1">
                                        {Object.entries(technicalErrorDetails).map(([key, value]) => (
                                            <li key={key} className="font-mono break-words">
                                                <strong className="font-semibold">{key}:</strong>
                                                <span className="block">{value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>
            
            {/* Info Text */}
            <div className="text-gray-500 text-sm mt-12 space-y-1">
                <p>Sử dụng tài khoản Microsoft của bạn để đăng nhập an toàn</p>
                <p>Dữ liệu của bạn được bảo mật theo tiêu chuẩn doanh nghiệp</p>
            </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 text-gray-600 text-sm">
            PetroVietnam © 2025  ·  50 năm phát triển
        </footer>
    </div>
  );
};

export default Auth;