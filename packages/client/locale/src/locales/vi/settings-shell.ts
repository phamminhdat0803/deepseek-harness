/** Vietnamese dictionary for the `settings.shell` namespace. */
export const vi = {
  'title': 'Shell',
  'description': 'Giới hạn thời gian chạy và lượng đầu ra tối đa của mỗi câu lệnh.',
  'timeoutMs': 'Thời gian chờ câu lệnh (ms)',
  'timeoutMsHint': 'Thời gian tối đa một câu lệnh được chạy trước khi bị dừng.',
  'maxOutputBytes': 'Giới hạn đầu ra mỗi luồng (byte)',
  'maxOutputBytesHint': 'Phần đầu ra vượt ngưỡng sẽ được ghi ra tệp tạm thay vì bị mất.',
  'overridden': 'Đã ghi đè',
  'reset': 'Khôi phục mặc định',
  'readOnly': 'Bản triển khai này lưu cài đặt ở chế độ chỉ đọc.',
  'unavailable': 'Plugin này chưa được tải nên hiện không thể cấu hình.',
  'save': 'Lưu',
  'saving': 'Đang lưu…',
  'saveFailed': 'Bản triển khai không chấp nhận các giá trị này; chúng được giữ lại để bạn sửa.',
  'invalidNumber': 'Nhập một số, hoặc để trống để dùng mặc định.',
} satisfies Record<string, string>
