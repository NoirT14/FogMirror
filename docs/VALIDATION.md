# Kết quả triển khai và kiểm tra

## Cử chỉ nắm tay → mở bàn tay

- 40/40 tests đạt, TypeScript và production build đạt. Tests bao gồm giữ nắm tay 500 ms, mở ổn định 150 ms trong cửa sổ 2 giây, cooldown 3 giây, mất tay, độ tin cậy thấp, frame bị gián đoạn, hủy tải và lỗi tải mô hình.
- MediaPipe Tasks Vision 0.10.32 và model Gesture Recognizer float16 v1 đóng gói cục bộ. Trang tests/gesture-smoke.html đã chạy mô hình thật trên canvas trống: PASS, 0 bàn tay; không mở camera/micro.
- MediaPipe có cảnh báo feedback tensors/projection trong console khi smoke test; suy luận vẫn hoàn tất. Chưa đo tốc độ nhận diện thực tế.
- UI 320×568 và 390×844 không tràn ngang; 1366×768 có chiều cao trang 768 px. Fullscreen 568×320: vùng điều khiển cao 228 px, nội dung cuộn 298 px, nằm trong màn hình.
- Chưa xác minh nhận động tác của người thật hoặc Safari iOS/Chrome Android. Suy luận hiện chạy main thread, tối đa khoảng 8 lần/giây với input cạnh dài 480 px; hiệu năng cần nghiệm thu trên điện thoại.
- Tắt/đổi camera và rời tab dừng nhận diện. Nút cử chỉ mặc định tắt và bị vô hiệu hóa khi chưa bật camera.

## Chụp ảnh và đổi camera

- 32/32 tests đạt; TypeScript và production build đạt.
- Đã bấm Chụp & lưu ảnh trong trình duyệt và xác nhận UI báo tạo PNG thành công.
- Các nút mới không tràn ngang tại 320×568, 390×844 và 1366×768; trang laptop vẫn cao 768 px kể cả thông báo chụp ảnh.
- Tests camera xác nhận dừng stream cũ, yêu cầu chính xác camera sau và không xin audio; xử lý camera sau không có; lấy hướng thực tế từ track settings.
- Chưa nghiệm thu đổi camera trên thiết bị thật hoặc lưu vào thư viện ảnh iOS/Android.

## Cập nhật mới nhất: responsive và touch (04/10/2026)

- 29/29 tests đạt; TypeScript và production build đạt.
- Viewport 320×568, 360×640, 390×844, 430×932, 768×1024 và 1366×768 không tràn ngang. Nhãn dài Hủy bật camera và phần chỉnh micro vẫn nằm trong khung.
- Tại 1366×768, chiều cao trang bằng 768 px; toàn bộ nội dung nằm trong viewport.
- Fullscreen tại 320×568, 390×844, 568×320, 844×390 và 1366×768 không có nút tràn ngang. Vùng điều khiển nằm trong màn hình; ẩn/hiện hoạt động.
- Bốn tests mới kiểm tra tọa độ kéo ngón tay theo DPR, tách nét khi nhấc tay, bỏ qua ngón thứ hai và kết thúc nét khi pointercancel.
- Các nút chính cao tối thiểu 44 px; slider có vùng tương tác 28 px, tăng thành 36 px trên thiết bị pointer coarse.
- Đã xem ảnh giao diện 390 px và 1366×768. Đây là kiểm tra viewport giả lập, chưa thay thế kiểm tra iOS/Android và thiết bị camera/micro thật.
- Fixture tests/layout.html dùng nhãn dài và hiển thị phần chỉnh micro để kiểm tra bố cục mà không bật thiết bị; không phải entry production.

Ngày: 03/10/2026. Môi trường: Windows, Node 22.16.0, npm 11.4.1.

## Đã đạt

- `npm run build`: TypeScript không lỗi; Vite xuất production assets vào dist.
- `npm test`: 10/10 đạt.
- Unit tests: cover/crop ngang và dọc, kích thước không hợp lệ, pointer offset/DPI, nét nhanh liên tục, tap đơn.
- Camera mock tests: chỉ xin video, dừng stream, giải phóng stream trả về sau khi hủy yêu cầu, mất kết nối và từ chối quyền.
- Chrome desktop: ảnh demo tải thành công; kéo để lau tạo vùng hình rõ; Lau sạch hiện toàn bộ hình; Phủ sương lại phủ toàn bộ.
- Slider cọ và sương cập nhật; nét vẫn tồn tại khi thay đổi sương.
- Resize từ desktop sang viewport 390×844 và trở lại giữ mask; không có tràn ngang quan sát được.
- Developer console không có error/warning trong lượt kiểm tra UI.
- Camera không tự bật khi tải trang. Không mở quyền camera thật trong lượt kiểm tra.

## Chưa xác minh

- Camera vật lý, chất lượng và tốc độ phản chiếu thời gian thực.
- Điện thoại cảm ứng thật, Safari iOS, Chrome Android, Edge.
- Mức FPS mục tiêu và kiểm tra heap liên tục 5 phút.
- Canvas blur fallback trên trình duyệt không hỗ trợ filter.
- Triển khai HTTPS, nhận diện tay và tính năng sau MVP.

## Cách nghiệm thu camera thủ công

1. Mở localhost, bấm Bật camera và cho phép camera.
2. Kiểm tra hình lật ngang, không méo, video chuyển động bên trong nét lau.
3. Viết, thay đổi sương, reset, lau sạch.
4. Tắt camera: kiểm tra đèn/biểu tượng camera của hệ điều hành tắt.
5. Bật lại và thử thu nhỏ/đổi tab; kiểm tra không xuất hiện stream hoặc vòng render trùng.
6. Thử từ chối quyền: giao diện vẫn cho dùng demo và hiện thông báo phù hợp.

## Cập nhật: tiếng thổi (03/10/2026)

- Build/TypeScript đạt; tổng 25/25 tests đạt.
- Tests mới: hiệu chuẩn, tiếng kéo dài, cooldown/latch, tiếng ngắn, phổ đơn âm, nền quạt ổn định, độ nhạy, khoảng gián đoạn, phổ tổng hợp, hiệu chuẩn lại.
- Kiểm thử micro giả lập: chỉ xin audio, hủy trước khi được cấp quyền, quyền bị từ chối, ngắt thiết bị, đóng AudioContext và track.
- UI Chrome: nút Bật tiếng thổi mặc định tắt; có trên desktop và viewport mobile 390px.
- Kiểm tra chuyển hình rõ sang phủ sương dần qua nút Phủ sương lại (cùng hàm hiệu ứng với callback tiếng thổi).
- Console không còn lỗi trong lượt kiểm tra cuối. Micro thật không được bật; khả năng nhận tiếng thổi thực tế chưa xác minh.
- Tài liệu Web Audio: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData
- Tắt noise suppression theo yêu cầu gợi ý của constraint; thiết bị/trình duyệt có thể bỏ qua: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/noiseSuppression

## Cập nhật: toàn màn hình

- TypeScript và production build đạt.
- Chrome: đã xác nhận mở toàn màn hình, thoát bằng nút và Esc, ẩn/hiện điều khiển.
- Đã vẽ trong fullscreen và xác nhận mask còn nguyên theo tỷ lệ khi thu nhỏ.
- Đã kiểm tra bố cục fullscreen tại viewport 844×390 và 390×844; nút camera, micro và thoát vẫn truy cập được.
- Console không có error/warning trong lượt kiểm tra cuối.
- Có fallback mở rộng kín vùng trang khi Fullscreen API không hỗ trợ hoặc bị từ chối; chưa kiểm chứng fallback trên iPhone thật.
- Lượt kiểm tra dùng ảnh demo, không bật webcam hoặc micro thật.
