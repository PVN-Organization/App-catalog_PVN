import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const FINAL_REDIRECT_URL = 'https://catalog-app-110937670224.us-west1.run.app';

const Auth: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse error from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get('error_description');
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashErrorDescription = hashParams.get('error_description');

    const finalError = errorDescription || hashErrorDescription;

    if (finalError) {
      const decodedError = decodeURIComponent(finalError.replace(/\+/g, ' '));
      
      if (decodedError.includes('AADSTS9002325')) {
          setErrorMessage(`Lỗi cấu hình xác thực. Có sự không khớp giữa loại ứng dụng trên Azure AD và cài đặt trên Supabase. Vui lòng kiểm tra kỹ:
1) Trên Azure AD: Ứng dụng phải được đăng ký dưới nền tảng "Web" (XÓA nền tảng "SPA" nếu có).
2) Trên Supabase: Trường "Secret Value" phải được điền chính xác với giá trị đã tạo trên Azure AD.`);
      } else if (decodedError.includes('Error getting user email from external provider')) {
        setErrorMessage(`Lỗi cấp quyền API. Supabase đã xác thực thành công nhưng không có quyền đọc thông tin người dùng từ Microsoft. Vui lòng kiểm tra lại:
1) Trên Azure AD, vào mục "API permissions".
2) Nhấn "+ Add a permission", chọn "Microsoft Graph", rồi "Delegated permissions".
3) Thêm các quyền: "email", "openid", "profile", và "User.Read".
4) Quan trọng: Nhấn nút "Grant admin consent for..." để cấp quyền cho toàn bộ tổ chức.`);
      } else {
          setErrorMessage(`Lỗi đăng nhập: ${decodedError}.`);
      }
      
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);


  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: FINAL_REDIRECT_URL,
      },
    });

    if (error) {
      console.error('Error initiating login:', error.message);
      setErrorMessage(`Lỗi đăng nhập: ${error.message}.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-xl max-w-sm w-full text-center border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Ứng dụng số PVN</h1>
        <p className="text-gray-600 mb-8">Vui lòng đăng nhập bằng tài khoản Microsoft để tiếp tục.</p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out disabled:bg-blue-400 disabled:cursor-not-allowed"
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
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.53 21.5H3.5V13.47H11.53V21.5M20.5 21.5H12.47V13.47H20.5V21.5M11.53 12.53H3.5V4.5H11.53V12.53M20.5 12.53H12.47V4.5H20.5V12.53Z"></path></svg>
              Đăng nhập với Microsoft
            </>
          )}
        </button>
        {errorMessage && (
          <div className="mt-6 text-sm text-left text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
            <p className="font-semibold">Đã xảy ra sự cố</p>
            <p className="mt-1 whitespace-pre-wrap">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;