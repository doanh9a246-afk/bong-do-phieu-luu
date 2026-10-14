# Bóng Đỏ Phiêu Lưu

Game đi cảnh 2D phong cách pixel: điều khiển Pikachu chạy qua đồi cỏ, nhảy qua vực và gai, nhặt sao, rồi hạ boss ở cuối màn. Có âm thanh tổng hợp ngay trong trình duyệt ("Pi-ka!" khi nhảy, "Pi-ka-chuuu" khi bật Vô địch, tiếng bước chân, nhặt sao…).

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
| Tuyệt kĩ Vô địch | `K` hoặc `Shift` | ⚡ |
| Tia sét (bắn xa) | `J` hoặc `X`, hoặc bấm nút ⚡ Sét góc phải dưới | Sét |
| Bật / tắt âm thanh | `M` | nút "Âm thanh" |
| Chơi lại | `R` | nút "Chơi lại" |

## Luật chơi

- Phải về đích trong **5 phút**; hết giờ là thua.
- Có **3 mạng**. Rơi xuống vực, chạm gai, chạm quái, chạm boss, trúng đạn hoặc laze đều mất 1 mạng. Hết mạng thì chơi lại từ đầu.
- **Cờ kiểm tra**: chạm qua thì lần ngã sau hồi sinh tại đó. Có 2 cờ, cờ thứ hai nằm ngay trước đấu trường boss.
- **Quái vuông đen**: nhảy giẫm lên đầu để hạ, chạm ngang thì mất mạng.
- **12 ngôi sao** rải khắp màn chơi.
- **Thanh chặng đường** phía trên màn hình cho biết bạn đã đi được bao xa.

### Tuyệt kĩ Vô địch

Bật trong 2 giây, hồi chiêu 10 giây. Trong lúc vô địch, Pikachu toả tia điện, không bị gai và lửa làm hại, chạm quái là quái vỡ. Rơi xuống vực vẫn mất mạng.

### Tia sét

Pikachu bắn tia sét thẳng về phía trước (cách nhau khoảng 0,55 giây, bay xa chừng 500 px):

- Hạ quái vuông chỉ với 1 phát.
- Triệt tiêu mũi băng và cầu lửa của boss khi bắn trúng.
- Lilith / Naamah: **3 tia sét trúng = 1 lần giẫm**. Tia sét bị dội lại khi ác quỷ đang tạo vòng ma lực, đang phong ấn hoặc vừa bị đánh.
- Boss hợp thể: chỉ mất máu khi đang Vô địch (1 máu mỗi tia, 2 máu nếu đang mang vết tích).

### Boss: Lilith & Naamah

Vào đấu trường thì cổng đóng lại. Trong đấu trường có 3 bục nhảy lơ lửng để né đạn và laze. Mỗi lần chỉ có một ác quỷ. Phải **giẫm lên đầu** để gây sát thương; chạm phía trước hay phía sau đều mất mạng.

| Giai đoạn | Ác quỷ | Tốc độ | Tấn công | Số lần giẫm |
|---|---|---|---|---|
| 1 | Lilith (băng) | Chậm | Không | 3 |
| 2 (Hell mode) | Lilith (băng) | Chậm | Mỗi 5 giây: vòng tinh thể băng + 3 mũi băng; phong ấn mỗi 5 giây | 3 |
| 3 (Hell mode) | Naamah (lửa) | Nhanh hơn | Mỗi 3 giây: vòng lửa + 4 cầu lửa; phong ấn mỗi 5 giây | 3 |

Vòng ma lực quanh ác quỷ đang tấn công chạm vào là mất mạng, và lúc đó không giẫm được. Đạn bay thẳng về phía trước: nhảy qua để tránh.

**Hell mode**: cứ 5 giây ác quỷ phong ấn bạn trong 3,5 giây. Bóng bị đóng băng, nhấn `Shift` (hoặc `K`, nút ⚡) để thoát. 1 giây trước khi phong ấn kết thúc, ác quỷ bắn laze sát mặt đất về phía bạn. Laze chỉ né được bằng cách nhảy lên (Vô địch không chặn được).

**Khi hạ được Lilith**: Lilith nứt ra, Naamah chui ra từ xác Lilith, biến mất rồi hiện ngay sau lưng quả bóng và đánh úp. Bóng bị giữ yên trong lúc này. Cách duy nhất để không mất mạng là bật **Vô địch** (`Shift`) trước khi bị cào; nếu Vô địch đang hồi chiêu thì chắc chắn mất 1 mạng. Hãy giữ sẵn Vô địch khi sắp hạ Lilith! Từ lúc Naamah xuất hiện, bầu trời và cảnh vật chuyển sang đỏ đen với trăng máu, cho tới khi Naamah bị hạ.

**Hợp thể**: hạ Naamah xong, hồn Lilith hiện về và hai ác quỷ hợp thể thành **Lilith × Naamah** (nửa băng, nửa lửa) với **20 máu**.

- Chỉ gây sát thương khi đang **Vô địch** (`Shift`): lao vào thân boss, mỗi lần chạm trừ **1 máu**. Chạm khi không Vô địch là mất mạng.
- Cứ 5 giây cả hai nửa **đồng loạt tấn công**: vòng băng lửa quanh thân, mũi băng bắn sang trái và cầu lửa bắn sang phải cùng lúc.
- Mỗi đợt tấn công để lại **2 vết tích** (mảnh băng và tàn lửa) trên mặt đất trong 9 giây. Lăn qua để nhặt (tối đa 5).
- **Vô địch + vết tích = sát thương gấp đôi**: mỗi lần chạm khi đang mang vết tích trừ 2 máu và tiêu 1 vết tích.

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
