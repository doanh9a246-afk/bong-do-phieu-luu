# Bóng Đỏ Phiêu Lưu

Game đi cảnh 2D phong cách pixel: điều khiển Pikachu chạy qua đồi cỏ, nhảy qua vực và gai, nhặt sao, rồi hạ boss ở cuối màn. Pikachu có bộ chiêu theo nguyên tác (Tia sét, Quả cầu điện, Lưới điện, Lao điện, 100.000 Vôn) và âm thanh tổng hợp ngay trong trình duyệt.

Chạy bằng HTML5 Canvas và JavaScript thuần, không cần cài đặt hay build.

## Chơi thử

Mở `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari), hoặc chạy một web server tĩnh bất kỳ trong thư mục này:

```bash
npx serve .
# hoặc
python -m http.server 8000
```

## Điều khiển

| Hành động | Bàn phím | Điện thoại |
|---|---|---|
| Chạy trái / phải | `←` `→` hoặc `A` `D` | ◀ ▶ |
| Nhảy (giữ lâu nhảy cao hơn) | `↑`, `W` hoặc `Space` | ▲ |
| Tia sét / Quả cầu điện | Bấm `J` (hoặc `X`) / giữ `J` rồi thả | Sét (bấm / giữ) |
| Lưới điện | `L` (hoặc `C`) | Lưới |
| Lao điện | `Shift` (hoặc `K`) | ⚡ |
| 100.000 Vôn | `U` (hoặc `V`) khi đầy điện năng | 100K |
| Bật / tắt âm thanh | `M` | nút "Âm thanh" |
| Chơi lại | `R` | nút "Chơi lại" |

## Bộ chiêu của Pikachu

Mọi chiêu đều tốn **điện năng** (thanh ⚡ ở góc trên, 0–100). Điện năng tự nạp dần, nạp nhanh hơn khi chạy, và tăng thêm khi nhặt sao (+15), hạ quái (+8) hoặc đánh trúng boss (+5).

| Chiêu | Tốn | Tác dụng |
|---|---|---|
| **Tia sét** (Thunder Shock) | 5 | Bắn thẳng, hạ quái nhỏ, phá đạn của địch, trừ 1 máu boss. |
| **Quả cầu điện** (Electro Ball) | 20 | Giữ `J` càng lâu cầu càng to; đúng nguyên tác, Pikachu chạy càng nhanh lúc thả thì càng mạnh (1–3 sát thương). Bay vòng cung, nảy một lần, xuyên qua quái nhỏ và đạn. |
| **Lưới điện** (Electroweb) | 30 | Quái hoặc boss dính lưới đứng yên, boss bị huỷ chiêu đang ra; lưới quét sạch đạn trên đường bay. |
| **Lao điện** (Volt Tackle) | 25 | Lao về phía trước, không bị tổn hại trong lúc lao, xuyên qua gai, đâm trúng boss trừ 2 máu. Là cách duy nhất để chặn cú đánh úp của Naamah. |
| **100.000 Vôn** (Thunderbolt) | 100 | Tuyệt chiêu: sét giáng khắp màn hình, xoá mọi đạn, hạ hết quái trong tầm nhìn, boss mất 5 máu và bị choáng 1,5 giây. |

## Luật chơi

- Phải về đích trong **5 phút**; hết giờ là thua.
- Có **3 mạng**. Rơi xuống vực, chạm gai, chạm quái, chạm boss, trúng đạn, cột băng, lửa hoặc laze đều mất 1 mạng. Hết mạng thì chơi lại từ đầu.
- **Cờ kiểm tra**: chạm qua thì lần ngã sau hồi sinh tại đó. Có 2 cờ, cờ thứ hai nằm ngay trước đấu trường boss.
- **12 ngôi sao** rải khắp màn chơi; **2 trái tim** +1 mạng (tối đa 5).
- **Biển “!”** đánh dấu chỗ có mẹo; đi tới gần sẽ hiện hướng dẫn ngắn.
- Vừa hồi sinh được bảo vệ 1,2 giây (nhấp nháy) để không bị chết lại ngay.

### Quái trên đường

| Quái | Hành vi | Cách hạ |
|---|---|---|
| Quái vuông đen | Đi qua đi lại | Giẫm, hoặc bất kỳ chiêu điện nào |
| **Dơi bóng tối** | Bay lượn sóng, lao xuống khi Pikachu tới gần | Giẫm, hoặc tia sét |
| **Chim băng** | Bay cao, thả cột băng nhọn; bóng đổ dưới đất báo trước chỗ rơi | Nhảy lên bắn sét, Quả cầu điện |
| **Ma lửa** | Lững lờ bay xuyên địa hình về phía Pikachu, giẫm không được | Chỉ chiêu điện |
| Ụ băng | Bắn mũi băng sát đất mỗi 2,4 giây | 2 tia sét, Quả cầu điện, Lao điện hoặc 1 cú giẫm |

## Boss: Lilith → Naamah → Lilith × Naamah

Vào đấu trường thì cổng đóng lại. Trong đấu trường có 3 bục nhảy để né chiêu và bắn trúng boss khi boss bay. Mỗi boss có **thanh máu** riêng. Sát thương: giẫm 2 · tia sét 1 · Quả cầu điện 1–3 · Lao điện 2 · 100.000 Vôn 5.

**Kiệt sức**: sau mỗi chiêu, boss thở dốc khoảng 1,4 giây (có sao xoay trên đầu). Đánh lúc này **sát thương ×2**.

| Boss | Máu | Di chuyển | Chiêu |
|---|---|---|---|
| **Lilith** (băng) | 12 | Bay lơ lửng theo hình số 8, thỉnh thoảng dịch chuyển qua gương băng; chỉ hạ xuống đất khi kiệt sức | Gai băng trồi lên dưới chân (khung xanh báo trước 0,8 giây), quạt 3 mũi băng nhắm vào Pikachu. Dưới nửa máu: **HELL MODE**, thêm vũng băng trơn trượt và phong ấn mỗi 8 giây |
| **Naamah** (lửa) | 12 | Đi trên mặt đất | Lao ngang đấu trường để lại vệt lửa, nhảy đập đất tạo sóng chấn động (nhảy qua), ném 3 cầu lửa vòng cung, dựng 3 cột lửa. Phong ấn mỗi 9 giây; dưới nửa máu gọi dơi |
| **Lilith × Naamah** (hợp thể) | 20 | Bay thấp, đi chậm | Đồng loạt bắn quạt mũi băng và ném cầu lửa, để lại 2 vết tích. Nửa máu sau: **laze quét dọc** cả đấu trường (lên bục cao nhất để né) và gọi dơi |

**Phong ấn**: Pikachu bị đóng băng trong 3,5 giây, nhấn `Shift` để thoát (không tốn điện). 1 giây trước khi phong ấn kết thúc, boss bắn laze sát mặt đất về phía Pikachu, chỉ né được bằng cách nhảy lên.

**Cú đánh úp**: hạ Lilith xong, Lilith nứt ra, Naamah chui ra từ xác Lilith, biến mất rồi hiện ngay sau lưng Pikachu và cào. Pikachu bị giữ yên; cách duy nhất để không mất mạng là **Lao điện** (`Shift`) trước khi bị cào, nên cần giữ ít nhất **25 điện năng**. Từ lúc Naamah xuất hiện, bầu trời và cảnh vật chuyển sang đỏ đen với trăng máu.

**Khiên của boss hợp thể**: chỉ hở khi Pikachu đang **Lao điện** hoặc boss **kiệt sức**; 100.000 Vôn luôn xuyên khiên. Nhặt **vết tích** (mảnh băng, tàn lửa) rơi ra sau mỗi đợt tấn công: mỗi vết tích làm đòn tiếp theo gây sát thương ×2.

Hạ được boss hợp thể thì cổng mở, trời trở lại bình thường và cờ đích xuất hiện. Tất cả phải xong trong 5 phút!

## Bảng xếp hạng

Bảng xếp hạng nằm ở góc trái trên màn hình game (bấm tiêu đề để thu gọn). Kết thúc lượt chơi (thắng hay thua), nhập tên để lưu điểm.

Xếp hạng theo **số boss đã hạ** (Lilith, Naamah, Lilith × Naamah: 0–3), bằng nhau thì ai **đi xa hơn** xếp trên, vẫn bằng thì ai **nhanh hơn** xếp trên. Mỗi tên chỉ giữ thành tích tốt nhất.

Mặc định bảng chỉ lưu trên máy đang chơi. Để mọi người dùng chung một bảng cập nhật trực tiếp:

1. Tạo một Google Sheet mới, vào **Tiện ích mở rộng → Apps Script**, dán toàn bộ [`server/leaderboard.gs`](server/leaderboard.gs), bấm Lưu.
2. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**, *Thực thi với tư cách: Tôi*, *Người có quyền truy cập: Bất kỳ ai*, bấm Triển khai và cấp quyền.
3. Sao chép **URL ứng dụng web** và dán vào hằng `LEADERBOARD_URL` ở đầu phần bảng xếp hạng trong `js/game.js`.

Điểm được lưu vào trang tính `Diem` của Google Sheet đó; bạn có thể xem hoặc xoá dòng trực tiếp trong Sheet.

## Ghi chú về nhân vật

Nhân vật chính và các boss là fan art dạng chibi, được vẽ hoàn toàn bằng code (hình khối trên canvas); âm thanh được tổng hợp bằng Web Audio. Không dùng hình ảnh hay âm thanh gốc nào. Pikachu thuộc bản quyền của Nintendo, Creatures Inc., GAME FREAK inc. và The Pokémon Company. Lilith, Naamah và *Black Clover* thuộc bản quyền của tác giả Yūki Tabata và các bên giữ bản quyền. Đây là dự án cá nhân, phi thương mại.

## Cấu trúc thư mục

```
index.html          Trang game, HUD, bảng xếp hạng và các bảng thông báo
css/style.css       Giao diện HUD, thanh chặng đường, thanh máu boss, nút cảm ứng
js/game.js          Màn chơi, vật lý, boss, vẽ hình và vòng lặp game
server/leaderboard.gs  Mã Google Apps Script cho bảng xếp hạng dùng chung
```
