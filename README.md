# Fog Mirror

Ứng dụng web biến webcam thành gương phủ sương. Kéo chuột hoặc ngón tay để viết/lau và lộ hình rõ bên dưới.

Demo GitHub Pages: https://noirt14.github.io/FogMirror/

## Tính năng

- Gương demo phủ sương trên Canvas 2D; vẽ/lau bằng chuột hoặc ngón tay.
- Camera trước/sau, tiếng thổi để phủ sương và chụp vùng gương thành PNG.
- Fullscreen, responsive cho điện thoại và màn 1366×768.
- Chức năng “Cử chỉ bàn tay” hiện được ẩn khỏi giao diện; mã được giữ để bật lại sau.
- Hình ảnh webcam và âm thanh chỉ xử lý trong trình duyệt; không có backend.

## Chạy trên máy

Yêu cầu: Node.js 22.12+; đã kiểm tra với Node 22.16.0 và npm 11.4.1 trên Windows.

```powershell
cd D:\2026\FogMirror
npm.cmd install
npm.cmd run dev
```

Mở URL localhost được in trong terminal (thường http://127.0.0.1:5173). Không mở index.html trực tiếp bằng file://.

## Deploy GitHub Pages

Repo này là project site `NoirT14/FogMirror`, vì vậy URL dùng đường dẫn `/FogMirror/`. Workflow `.github/workflows/deploy-pages.yml` tự build và deploy khi push lên `main`.

```powershell
npm.cmd test
npm.cmd run build
git add .
git commit -m "Deploy Fog Mirror"
git push origin main
```

Nếu Pages chưa bật, vào **Settings → Pages** và chọn **GitHub Actions** làm source. Domain `github.io` có HTTPS nên camera/micro có thể xin quyền; người dùng vẫn phải cấp quyền thiết bị.

Hoặc nhấp đôi `start.cmd` để khởi động sau khi đã cài dependency. Đóng cửa sổ terminal của start.cmd để dừng server.

## Sử dụng

- Trang mở ở chế độ demo với ảnh minh họa nội bộ, không tự bật camera.
- Giữ và kéo trên gương để viết/lau sương.
- Nét cọ thay đổi đường kính cọ; Lớp sương thay đổi blur và độ trắng.
- Phủ sương lại xóa toàn bộ nét; Lau sạch hiển thị toàn bộ hình rõ.
- Bật camera để dùng gương thật; trình duyệt sẽ hỏi quyền. Camera không yêu cầu micro; micro chỉ bật riêng khi dùng tính năng tiếng thổi.
- Bấm Hủy bật camera nếu đang chờ quyền, hoặc Tắt camera để quay về demo.
- Ảnh webcam được xử lý trong trình duyệt, không có backend hoặc mã tải ảnh lên server.

Camera cần HTTPS hoặc localhost. HTTP qua địa chỉ IP LAN trên điện thoại thường không được cấp camera. Bản hiện tại bind 127.0.0.1 để dùng trên máy này; chưa deploy công khai.

## Stack và cấu trúc

- Vite 8.3.2, TypeScript 7.0.2, MediaPipe Tasks Vision 0.10.32 (chỉ tải khi bật cử chỉ).
- Canvas 2D: clear buffer + fog buffer + mask lưu nét.
- getUserMedia và Pointer Events.
- CSS responsive, SVG demo tự chứa và không dùng tài nguyên bên ngoài.

```text
src/main.ts                     Giao diện, trạng thái và kết nối các module
src/camera/CameraController.ts   Camera, hủy yêu cầu và dọn stream
src/render/MirrorRenderer.ts     Vòng render, crop/lật và compositing
src/render/FogLayer.ts           Blur giảm độ phân giải, tint, noise
src/render/MaskCanvas.ts         Cọ mềm, mask, reset và resize
src/input/PointerBrush.ts        Pointer capture và nét liên tục
src/utils/geometry.ts            Tọa độ, cover, nội suy nét
tests/                          Kiểm thử hình học và camera giả lập
```

## Build và kiểm thử

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

Build nằm trong `dist/`. Node 22.16 có thể in cảnh báo experimental cho type stripping khi chạy test; đây không phải lỗi test.

Kết quả mới nhất: 40/40 tests đạt; TypeScript và production build đạt. Xem [báo cáo kiểm tra](docs/VALIDATION.md).

## Giới hạn hiện tại

- Chưa có vẽ bằng tay trong không khí hoặc sương tự hồi phục theo thời gian. Đã có xuất PNG và cử chỉ nắm/mở tay để phủ sương.
- Resize giữ nét theo tỷ lệ; đổi mạnh tỷ lệ màn hình có thể làm nét biến dạng.
- Safari iOS, Chrome Android, Edge và fallback không hỗ trợ Canvas filter chưa kiểm tra thực tế.
- Hiệu suất webcam phụ thuộc thiết bị; chưa công bố đạt mục tiêu FPS.

## Kế hoạch và tham khảo

- [Kế hoạch](docs/PLAN.md)
- [Checklist](docs/TASKS.md)
- Video tham khảo: https://www.douyin.com/video/7691332654691807467

Thiết kế tái tạo hiệu ứng quan sát được; không khẳng định công nghệ hoặc phương thức nhập liệu của tác giả video.

## Thổi để phủ sương

1. Bấm **Bật tiếng thổi** bên dưới thanh công cụ và cho phép micro.
2. Giữ yên khoảng 1,6 giây để ứng dụng đo tiếng nền.
3. Lau/vẽ hoặc bấm Lau sạch. Thổi nhẹ về phía micro của thiết bị khoảng nửa giây; sương sẽ hiện lại trong khoảng 1,1 giây.
4. Nếu khó nhận: tăng Độ nhạy. Nếu hay nhận nhầm: giảm Độ nhạy hoặc bấm Đo lại nền khi đang yên lặng.
5. Bấm Tắt tiếng thổi để dừng micro. Rời tab cũng tắt micro; quay lại cần tự bật lại.

Tính năng dùng âm thanh micro, không nhận diện môi bằng camera; hoạt động cả ở chế độ demo. Không ghi file âm thanh, không gửi âm thanh ra mạng, không phát tiếng micro ra loa. Khi thổi mà sương đang dưới 35%, app đưa mức sương về 70% để hiệu ứng nhìn thấy rõ.

Thuật toán cục bộ dùng mức âm thanh tương đối với tiếng nền, độ phân tán phổ và khoảng thổi kéo dài. Có ngưỡng 240 ms, khoảng nghỉ 2 giây và yêu cầu yên lặng trước lần kích hoạt tiếp theo. Đây là heuristic, không phải mô hình xác định tiếng thổi tuyệt đối: tiếng quạt, gió, tiếng xì hoặc một số âm nói có thể gây nhận nhầm. Chưa kiểm chứng bằng tiếng thổi thật trên micro của người dùng; cần chỉnh độ nhạy theo thiết bị.

Mã: `src/audio/BreathController.ts`, `src/audio/breathSignal.ts`. Dùng Web Audio AnalyserNode, không thêm dependency.

## Toàn màn hình

Bấm **Toàn màn hình** ở góc trên bên phải gương. Gương phủ toàn bộ màn hình, các thanh điều khiển nổi ở dưới. Dùng **Ẩn điều khiển** để nhìn toàn bộ hình camera; bấm **Hiện điều khiển** để dùng lại cọ, sương, camera và micro. Thoát bằng **Thu nhỏ** hoặc **Esc**.

Hoạt động với cả camera và demo; không tự bật camera. Nếu trình duyệt nhúng hoặc điện thoại không hỗ trợ Fullscreen API, gương mở rộng kín vùng trang (thanh trình duyệt có thể vẫn còn). Nét vẽ được giữ theo tỷ lệ khi mở/thu nhỏ.

Mã điều khiển: `src/ui/FullscreenController.ts`.

## Responsive và vẽ bằng ngón tay (04/10/2026)

### Nắm tay → mở xòe để phủ sương

Phần Cử chỉ bàn tay hiện được ẩn khỏi giao diện theo yêu cầu; mã và mô hình được giữ để có thể bật lại sau.

1. Bật camera, sau đó bấm **Bật cử chỉ bàn tay**. Lần đầu cần chờ tải mô hình.
2. Đưa một bàn tay vào khung hình, đủ sáng; nắm lại khoảng 0,5 giây.
3. Khi hiện “Đã sẵn sàng”, mở xòe bàn tay trong 2 giây và giữ một nhịp. Sương sẽ phủ lại.
4. Chờ 3 giây trước lần tiếp theo. Bấm Tắt cử chỉ bàn tay để ngừng nhận diện.

Cử chỉ dùng camera hiện tại, không mở thêm camera hoặc micro. Tắt/đổi camera và rời tab sẽ tắt cử chỉ; cần tự bật lại. Mô hình và WASM được phục vụ từ cùng ứng dụng, không tải ảnh camera lên mạng. Model nguồn: Google MediaPipe Gesture Recognizer float16 phiên bản 1; thư viện Apache-2.0. Tài liệu: https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js

Nhận diện giới hạn tối đa khoảng 8 lần/giây, ảnh đầu vào cạnh dài 480 px. Hiện suy luận chạy trên main thread; điện thoại yếu có thể khựng, có thể tắt riêng cử chỉ. Chưa nghiệm thu cử chỉ bằng tay thật trên camera hoặc thiết bị di động. Các tệp WASM khoảng 22 MB tổng (trình duyệt chỉ tải biến thể phù hợp) và model được đóng gói trong dist.

### Chụp ảnh và đổi camera

- Bấm **Chụp & lưu ảnh** để tạo PNG của vùng gương: hình demo/camera, sương và nét lau; không chứa các nút hoặc lời chào trang trí. Ảnh có kích thước bằng canvas đang hiển thị. Trình duyệt quản lý tải xuống; trên điện thoại ảnh có thể nằm trong Tệp/Downloads, chưa tự thêm vào thư viện Ảnh.
- Bật camera rồi bấm **Đổi camera trước/sau**. Camera trước phản chiếu, camera sau không lật; nét lau giữ nguyên khi đổi thành công. Camera cũ được dừng trước khi mở camera mới.
- Nếu máy không có camera yêu cầu hoặc không mở được, ứng dụng hiện lỗi và trở về demo. Có thể bấm Bật camera để thử lại camera mặc định.
- Kiểm tra mới nhất: 32/32 tests đạt và build đạt. Kiểm tra mock gồm đổi sang camera sau, camera không có sẵn, hướng camera thực tế. Chưa xác minh camera trước/sau trên điện thoại thật.

Điện thoại hỗ trợ chạm và kéo trực tiếp trên gương để vẽ/lau sương. Nhấc tay để kết thúc nét; ngón thứ hai không chiếm nét đang vẽ. Tính năng này không cần bật camera và không phải nhận diện tay trong không khí.

Đã sửa bố cục ở 320, 360, 390, 430, 768 và 1366 px: không tràn ngang, nút camera riêng một hàng trên điện thoại, các nút chính cao tối thiểu 44 px. Trang ở 1366×768 vừa trong viewport. Fullscreen có vùng điều khiển cuộn và nút ẩn/hiện.

Kết quả mới nhất: 29/29 tests đạt, TypeScript và production build đạt. Kiểm tra màn hình bằng viewport giả lập; chưa kiểm chứng cảm ứng, camera và micro trên điện thoại thật. Link localhost chỉ dùng trên máy đang chạy; để dùng camera trên điện thoại cần triển khai HTTPS.
