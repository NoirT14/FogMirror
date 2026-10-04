# Kế hoạch triển khai Fog Mirror

## 1. Mục tiêu và phạm vi

Tạo một website gương webcam phủ hơi nước với cảm giác nhẹ, mượt và tối giản như video tham chiếu. Trọng tâm là vật liệu sương và nét lau làm lộ hình thật đang chuyển động.

### MVP bắt buộc

1. Màn hình giới thiệu ngắn với nút Bật gương.
2. Xin quyền camera sau khi bấm nút; không yêu cầu microphone.
3. Phản chiếu webcam lật ngang, giữ đúng tỷ lệ và phủ vùng hiển thị.
4. Lớp sương gồm hình làm mờ, sắc trắng sữa và hạt noise nhẹ.
5. Viết/lau bằng chuột, trackpad qua thao tác kéo, bút hoặc cảm ứng.
6. Điều chỉnh kích thước cọ và độ sương.
7. Hai thao tác riêng: Phủ sương lại và Lau sạch.
8. Nút Tắt camera, trạng thái lỗi dễ hiểu, hỗ trợ đổi kích thước màn hình.
9. Chế độ demo bằng hình nền có sẵn để thử hiệu ứng khi không dùng camera.

### Chưa đưa vào MVP

Nhận diện bàn tay, đăng nhập, database, đồng bộ đám mây, thanh toán, ghi video, nhận diện tiếng thổi và mô phỏng vật lý giọt nước. Không cần Three.js hoặc backend cho MVP.

## 2. Trải nghiệm người dùng

Luồng chính: Mở trang → Bật gương → Trình duyệt hỏi quyền → Gương phủ sương → Kéo để viết → Điều chỉnh hoặc reset.

- Trước khi bật: hiển thị preview demo, hướng dẫn một câu và nút bật camera.
- Trong gương: vùng tương tác chiếm phần lớn màn hình; toolbar nhỏ ở dưới, không che nét vẽ.
- Desktop: nhấn giữ và kéo để lau; thả để ngắt nét.
- Mobile: một ngón tay để lau; chỉ tắt cuộn mặc định trong vùng gương.
- Bút cảm ứng: dùng cơ chế pointer chung; độ dày theo lực nhấn để sau MVP.
- Toolbar: Cọ, Sương, Phủ sương lại, Lau sạch, Tắt camera.
- Phủ sương lại: mask trở về 0 trên toàn vùng.
- Lau sạch: mask trở về 1 trên toàn vùng, hình rõ vẫn chuyển động.
- Khi từ chối camera: hiện nút thử lại và lựa chọn demo; không tự lặp yêu cầu quyền.
- Mất camera giữa chừng: dừng xử lý khung hình, thông báo kết nối bị ngắt.

## 3. Kiến trúc kỹ thuật

Dùng Vite + TypeScript + Canvas 2D + CSS thuần. React có thể thêm khi giao diện phát triển, chưa cần cho phạm vi này. Chỉ thêm dependency khi có nhu cầu cụ thể.

### Cấu trúc dự kiến sau khi triển khai

```text
FogMirror/
  index.html
  package.json
  package-lock.json
  tsconfig.json
  src/
    main.ts
    styles.css
    camera/CameraController.ts
    render/MirrorRenderer.ts
    render/FogLayer.ts
    render/MaskCanvas.ts
    input/PointerBrush.ts
    ui/Toolbar.ts
    utils/geometry.ts
    types.ts
  public/
    demo/
  docs/
    PLAN.md
    TASKS.md
```

### Trách nhiệm từng phần

- CameraController: xin quyền, gắn MediaStream vào video, đợi video sẵn sàng, dừng track, xử lý lỗi.
- MirrorRenderer: quản lý vòng render, kích thước, crop/lật ngang và ghép các lớp.
- FogLayer: tạo hình webcam mờ, tint trắng sữa, texture noise được tạo trước và tái sử dụng.
- MaskCanvas: lưu vùng đã lau độc lập với hình webcam; hỗ trợ reset và resize.
- PointerBrush: nhận pointer, chuyển tọa độ, làm mượt đường, đóng nét khi mất pointer.
- Toolbar: cập nhật cấu hình renderer, nhãn trạng thái và thao tác camera.

### Pipeline dựng hình

1. Lấy một khung webcam, crop theo kiểu cover và lật ngang một lần vào buffer hình rõ.
2. Từ cùng buffer đó tạo hình mờ, thêm tint và noise để thành hình phủ sương.
3. Vẽ hình phủ sương lên canvas đầu ra.
4. Sao chép hình rõ sang buffer tạm; áp mask bằng destination-in.
5. Vẽ buffer hình rõ đã cắt lên hình phủ sương.

Công thức: output = clear × mask + fog × (1 − mask).

Mask là alpha: 0 là chưa lau, 1 là lau sạch. Trạng thái mask tồn tại qua các khung hình; chỉ buffer camera được cập nhật liên tục. Không dùng getImageData/putImageData để xử lý toàn màn hình mỗi frame.

Không chỉ phủ một lớp trắng lên video vì hình chưa lau vẫn sẽ quá sắc nét. Không blur toàn bộ canvas đầu ra vì sẽ làm cả nét lau bị mờ.

### Tọa độ và kích thước

- Một hàm dùng chung tính phép cover: scale = max(viewWidth/videoWidth, viewHeight/videoHeight), sau đó crop giữa.
- Cả hình rõ và mờ dùng cùng một nguồn đã biến đổi để tránh lệch nội dung trong nét lau.
- Pointer dùng tọa độ tương đối với boundingClientRect của canvas, rồi đổi sang pixel buffer.
- Giới hạn devicePixelRatio tối đa 2 ban đầu để tránh buffer quá lớn.
- Resize: chụp mask cũ vào buffer tạm và scale sang kích thước mới; ghi rõ đây là cách giữ bố cục tương đối, có thể biến dạng khi đổi tỷ lệ lớn.
- Theo dõi pointerId đang hoạt động, dùng pointer capture; kết thúc nét trên pointerup, pointercancel, lostpointercapture.

### Nét cọ

Bắt đầu với cọ tròn khoảng 28 CSS px, cho chỉnh trong khoảng 8–80 px. Nội suy giữa hai mẫu liên tiếp, bước stamp không lớn hơn khoảng 1/4 đường kính cọ. Dùng mép mềm nhẹ, tâm nét đủ rõ. Sau khi cơ chế ổn định mới tinh chỉnh nét theo tốc độ để tạo cảm giác chữ viết tay.

## 4. Các giai đoạn triển khai

### P0 — Khởi tạo môi trường và bộ khung (ước lượng 2–3 giờ)

- Kiểm tra Node/npm và yêu cầu phiên bản của Vite.
- Khởi tạo vanilla-ts, lock dependency, thêm script dev/build/preview và typecheck nếu cần.
- Tạo layout responsive gồm vùng gương, trạng thái và toolbar.
- Chuẩn bị ảnh demo nội bộ, không phụ thuộc hotlink.

Đầu ra: app mở được, demo tĩnh hiển thị đúng tỷ lệ, build thành công.

### P1 — Camera và vòng đời (3–5 giờ)

- Bật camera có audio:false sau một thao tác rõ ràng của người dùng.
- Chọn camera trước với facingMode dạng ideal khi phù hợp.
- Dùng video muted/playsInline, đợi metadata và frame sẵn sàng.
- Hiển thị hình lật ngang với cover đúng tỷ lệ.
- Xử lý từ chối quyền, không có thiết bị, thiết bị đang bận và track bị ngắt.
- Tắt toàn bộ MediaStreamTrack khi người dùng tắt camera hoặc rời ứng dụng.

Đầu ra: camera hoạt động ổn định, có fallback demo và trạng thái lỗi rõ ràng.

### P2 — Hiệu ứng sương và nét lau (5–8 giờ)

- Triển khai clear buffer, fog buffer, mask và compositor.
- Thử blur khoảng 12–20 CSS px, tint trắng sữa và noise nhẹ; thông số là điểm bắt đầu, cần xem thực tế.
- Triển khai chuột và touch qua Pointer Events.
- Bảo đảm nét liên tục khi kéo nhanh, không nối hai nét riêng nhau.
- Thêm reset mask và làm sạch toàn màn hình.

Đầu ra: viết chữ làm lộ hình webcam đang chuyển động, cả phần rõ và mờ khớp nhau.

### P3 — Hoàn thiện giao diện và mobile (3–5 giờ)

- Toolbar gọn, nút đủ lớn cho thao tác chạm, có nhãn truy cập và focus bằng bàn phím.
- Chỉnh cọ và độ sương không làm mất nét đã vẽ.
- Xử lý resize, xoay màn hình và thiết bị có DPR cao.
- Hướng dẫn ngắn tự ẩn sau lần thao tác đầu.
- Tinh chỉnh màu sắc, mép cọ và chuyển trạng thái.

Đầu ra: dùng được trên desktop và điện thoại, không cuộn trang khi đang vẽ trong gương.

### P4 — Hiệu năng, kiểm thử và bàn giao MVP (3–5 giờ)

- Đo FPS và thời gian render trên thiết bị thật; ghi rõ thiết bị, trình duyệt và độ phân giải.
- Mục tiêu khoảng 50–60 FPS trên desktop tham chiếu; tối thiểu khoảng 30 FPS trên điện thoại tham chiếu, cần đo để xác nhận.
- Nếu chậm: giảm độ phân giải riêng của fog buffer, cache noise, tránh cấp phát trong render loop và giảm DPR.
- Tạm dừng render khi trang bị ẩn; khi quay lại không tạo thêm vòng render trùng.
- Hoàn tất kiểm tra build/typecheck và các tình huống nghiệm thu bên dưới.
- Viết hướng dẫn chạy, giới hạn đã biết và thông số đã kiểm thử.

Đầu ra: bản MVP có thể chạy và bàn giao. Deploy HTTPS chỉ thực hiện khi bước triển khai được yêu cầu; truy cập camera từ điện thoại qua HTTP IP LAN không được coi là môi trường tương đương localhost.

### P5 — Nhận diện bàn tay, tùy chọn (6–12 giờ)

Chỉ bắt đầu sau khi MVP đạt nghiệm thu.

- Dùng MediaPipe Hand Landmarker từ @mediapipe/tasks-vision.
- Dùng đầu ngón trỏ làm tọa độ cọ; chụm ngón cái/ngón trỏ để bật vẽ.
- Chuẩn hóa ngưỡng chụm theo kích thước bàn tay, dùng hai ngưỡng vào/ra để tránh nhấp nháy.
- Làm mượt tọa độ, có con trỏ báo đang vẽ hoặc chỉ di chuyển.
- Quy đổi tọa độ theo đúng crop và lật ngang của webcam.
- Mất dấu bàn tay phải ngắt nét ngay; không nối nét khi tay xuất hiện lại.
- Giới hạn tần suất nhận diện; cân nhắc worker nếu đo thấy nhận diện chặn UI.
- Luôn giữ chế độ chuột/cảm ứng dự phòng.

Đầu ra: có thể viết trong không khí, bật/tắt riêng, không làm giảm độ ổn định của MVP.

### P6 — Nâng cấp thẩm mỹ, tùy chọn (4–8 giờ)

- Sương tự quay lại bằng cách giảm dần alpha mask theo thời gian thực dt.
- Preset sương nhẹ/dày và nét cọ mềm.
- Xuất PNG từ canvas đã compositing; xử lý đúng hướng ảnh.
- Fullscreen khi trình duyệt hỗ trợ, có fallback.
- Chỉ cân nhắc WebGL nếu hiệu năng Canvas không đạt sau tối ưu đo được.

## 5. Tiêu chí nghiệm thu

### Chức năng

- Không bật camera trước khi người dùng bấm Bật gương.
- Từ chối quyền không gây màn hình trắng hoặc vòng hỏi quyền lặp.
- Hình lật ngang đúng, không bị kéo giãn.
- Vùng được lau rõ hơn vùng phủ sương và cùng hiển thị một khung hình.
- Viết nhanh tạo đường liền; thả rồi nhấn lại không xuất hiện đường nối ngoài ý muốn.
- Reset phủ kín sương; Lau sạch cho hình rõ toàn bộ.
- Chỉnh slider không làm mất mask.
- Di chuyển qua toolbar không để lại nét; thoát vùng canvas không làm kẹt trạng thái vẽ.
- Tắt camera dừng các track; bật lại không tạo stream hoặc render loop trùng.

### Thiết bị và hiệu năng

- Kiểm tra Chrome và Edge desktop; kiểm tra Safari iOS và Chrome Android khi có thiết bị.
- Kiểm tra viewport nhỏ, DPR cao, xoay màn hình và resize liên tục.
- Chạy liên tục 5 phút, theo dõi bộ nhớ không tăng không giới hạn.
- Test trên máy không có camera qua chế độ demo.
- Trình duyệt/thiết bị chưa thử phải được ghi là chưa xác minh, không tự coi đã hỗ trợ.

### Kiểm tra tự động có giá trị

- Typecheck và production build.
- Unit test phép cover/crop, ánh xạ pointer và tọa độ lật ngang vì dễ gây lệch nét.
- Test giá trị reset mask và resize nếu logic được tách độc lập.
- Smoke test demo: vẽ → thay đổi mask → reset; không cần quyền camera thật.
- Kiểm tra vật liệu sương bằng mắt; không thay thế bằng test chỉ kiểm tra DOM.

## 6. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Sương giống một tấm trắng | Phải làm mờ hình webcam bên dưới; giảm tint, thêm noise nhẹ |
| Nét lau lệch hình | Dùng cùng buffer đã crop/lật cho hình rõ và mờ |
| Điện thoại nóng hoặc lag | Giảm fog resolution/DPR, cache texture và đo thời gian render |
| Camera không mở | Phân biệt thiếu HTTPS, từ chối quyền và không có thiết bị; cho demo |
| Nét vẽ đứt khi kéo nhanh | Nội suy các điểm và quản lý pointer capture |
| Nhận diện tay rung | Lọc tọa độ, hysteresis cho pinch, ngắt nét khi mất tracking |
| Canvas filter khác nhau giữa trình duyệt | Kiểm tra hỗ trợ thực tế; dự phòng blur bằng buffer giảm độ phân giải |

## 7. Ước lượng và thứ tự ưu tiên

MVP: khoảng 16–26 giờ làm việc tập trung, tương đương 3–5 ngày nếu mỗi ngày 5–6 giờ. Bản có nhận diện bàn tay và nâng cấp thẩm mỹ: thêm khoảng 10–20 giờ. Đây là ước lượng lập kế hoạch, không phải cam kết thời gian; phụ thuộc thiết bị kiểm thử và số vòng chỉnh hiệu ứng.

Thứ tự: camera đúng → mask đúng → nét mượt → chất liệu sương đẹp → mobile ổn → đo hiệu năng → nhận diện tay.

## 8. Tài liệu kỹ thuật

- Camera: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Canvas compositing: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
- Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- Hand Landmarker: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
