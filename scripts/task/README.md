# DeepSeek Harness Web Scheduled Task (`dsh-web`)

Khởi động `dsh web` tự động qua **Windows Task Scheduler** khi đăng nhập Windows mỗi sáng.

## Thông tin Task
- **Tên Task**: `dsh-web`
- **Trigger**: At log on của user `Welcome`
- **Port**: `http://127.0.0.1:3080`
- **Logs**: `logs/dsh-web.log` (ghi nhận token và URL truy cập)
- **Cơ chế**:
  - Chạy ngầm hoàn toàn qua VBScript (không hiện cửa sổ terminal đen).
  - Tự động mở trình duyệt mặc định truy cập web kèm token xác thực.
  - Khi gõ lệnh `dsh web`, nếu task đang chạy thì tự mở lại link trên trình duyệt, không mở tiến trình thứ hai trùng lặp.

## Quản lý Task

### 1. Dùng file script tiện ích trong thư mục `scripts/task/`
- **`stop-task.bat`**: Dừng task và giải phóng port 3080.
- **`start-task.bat`**: Bật lại task.
- **`restart-task.bat`**: Khởi động lại task.
- **`rebuild-and-restart.bat`**: Tự động: Dừng task -> `git pull` -> `pnpm run build` -> Bật lại task.
- **`install-task.bat`**: Cài đặt / cập nhật lại Scheduled Task.
- **`uninstall-task.bat`**: Gỡ bỏ Scheduled Task khỏi hệ thống.

### 2. Dùng giao diện Windows Task Scheduler (`taskschd.msc`)
- Nhấn `Win + R` -> gõ `taskschd.msc` -> Enter.
- Chọn **Task Scheduler Library** -> tìm task **`dsh-web`**.
- Chuột phải:
  - Chọn **End** để tắt.
  - Chọn **Run** để bật.

### 3. Dùng lệnh CMD / PowerShell (Không cần quyền Admin)
- Dừng: `schtasks /end /tn "dsh-web"`
- Bật: `schtasks /run /tn "dsh-web"`
