/**
 * Tải tệp lên webhook n8n được cung cấp.
 * @param file Tệp cần tải lên.
 * @returns Một promise phân giải với URL của tệp đã tải lên từ phản hồi của webhook.
 */
export const uploadFileToSharePoint = async (file: File): Promise<string> => {
  const webhookUrl = 'https://n8n.oilgas.ai/webhook/api/catalog_upload';
  
  console.log(`Đang tải tệp "${file.name}" lên webhook: ${webhookUrl}`);

  // Tạo một đối tượng FormData để gửi tệp.
  // 'data' là tên trường cho dữ liệu nhị phân như đã chỉ định trong cấu hình n8n.
  const formData = new FormData();
  formData.append('data', file, file.name);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // Không cần đặt header 'Content-Type', trình duyệt sẽ tự động đặt nó 
      // thành 'multipart/form-data' với boundary chính xác.
    });

    if (!response.ok) {
      // Nếu máy chủ trả về lỗi, ném một lỗi để bắt ở khối catch.
      const errorText = await response.text();
      throw new Error(`Lỗi máy chủ: ${response.status} ${response.statusText}. Phản hồi: ${errorText}`);
    }

    // API trả về một mảng chứa một đối tượng.
    const result = await response.json();
    
    // Kiểm tra xem phản hồi có phải là một mảng và có chứa ít nhất một phần tử không.
    if (!Array.isArray(result) || result.length === 0) {
      console.error('Định dạng phản hồi API không hợp lệ. Mong đợi một mảng chứa dữ liệu tệp.', result);
      throw new Error('Định dạng phản hồi API không hợp lệ.');
    }

    // Lấy đối tượng đầu tiên từ mảng.
    const fileData = result[0];
    
    // Trích xuất thuộc tính 'webUrl'.
    const fileUrl = fileData?.webUrl;

    if (!fileUrl || typeof fileUrl !== 'string') {
      console.error("Không tìm thấy thuộc tính 'webUrl' hợp lệ trong phản hồi webhook:", fileData);
      throw new Error("Không thể trích xuất 'webUrl' từ phản hồi API.");
    }

    console.log(`Tệp đã được tải lên thành công. URL nhận được: ${fileUrl}`);
    return fileUrl;

  } catch (error) {
    console.error('Lỗi khi tải tệp lên:', error);
    if (error instanceof Error) {
        throw new Error(`Lỗi tải tệp lên: ${error.message}`);
    }
    throw new Error('Lỗi không xác định khi tải tệp lên.');
  }
};