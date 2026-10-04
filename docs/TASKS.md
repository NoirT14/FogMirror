# Checklist triển khai

## Cử chỉ bàn tay

- [x] Nhận nắm tay rồi mở xòe bằng MediaPipe, mô hình phục vụ cục bộ.
- [x] Công tắc riêng, hướng dẫn trạng thái, dừng khi đổi/tắt camera hoặc rời tab.
- [x] Kiểm thử chuỗi cử chỉ, hủy/lỗi tải; 40/40 tests và build đạt.
- [x] Smoke test tải/suy luận mô hình trong trình duyệt với canvas trống.
- [ ] Nghiệm thu cử chỉ với bàn tay và camera thật; đo hiệu năng điện thoại.

## Bổ sung 04/10/2026

- [x] Sửa responsive 320–1366 px, nút camera riêng hàng trên điện thoại.
- [x] Kiểm tra fullscreen dọc/ngang và ẩn/hiện điều khiển.
- [x] Bổ sung 4 tests pointer touch; tổng hiện tại 29/29 tests, build đạt.
- [ ] Nghiệm thu thao tác ngón tay trên điện thoại thật.

Cập nhật 03/10/2026. Đã triển khai MVP và kiểm tra demo trên Chrome. Các kiểm tra thiết bị thật còn để mở.

## Đã hoàn thành
- [x] P0: Vite + TypeScript, scripts, lockfile, layout, ảnh demo nội bộ, build.
- [x] P1: camera sau thao tác người dùng, audio:false, playsInline, lật/crop, xử lý lỗi, hủy và dọn track.
- [x] P2: clear/fog buffers, persistent mask, compositing, cọ mềm, nội suy và pointer capture.
- [x] P2: ngắt nét đúng lúc, Phủ sương lại và Lau sạch.
- [x] P3: slider, toolbar, resize/DPR, giữ mask, focus/labels và responsive.
- [x] P4: typecheck, production build và 10 unit tests.
- [x] P4: kiểm tra demo thủ công trên Chrome desktop và viewport 390×844.
- [x] P4: README, start.cmd và báo cáo kiểm tra.

## Cần kiểm tra trên thiết bị thật
- [ ] Webcam thật: phản chiếu, chuyển động trong nét, đèn camera tắt khi dừng.
- [ ] Safari iOS, Chrome Android, Edge và touch/bút thật.
- [ ] Đo FPS và heap trong 5 phút.
- [ ] Fallback blur không dùng Canvas filter.

## Sau MVP
- [ ] P5: hand tracking + pinch + smoothing + mất tracking.
- [ ] P6: sương hồi phục theo thời gian, xuất PNG.
- [x] Fullscreen: mở/thu nhỏ, Esc, ẩn/hiện điều khiển và giữ mask khi resize.
- [ ] Deploy HTTPS khi được yêu cầu.

## Tính năng thêm theo yêu cầu: thổi để phủ sương
- [x] Micro bật/tắt riêng, quyền, hủy yêu cầu và giải phóng thiết bị.
- [x] Web Audio, hiệu chuẩn nền, độ nhạy, meter và nút đo lại.
- [x] Nhận tiếng kéo dài bằng heuristic, chống lặp liên tục.
- [x] Hiệu ứng sương trở lại dần, dùng chung với nút reset.
- [x] Kiểm thử tự động 25/25 và UI desktop/mobile viewport.
- [ ] Thử tiếng thổi thật và điều chỉnh ngưỡng theo micro của người dùng.
