# Bóng Đỏ Phiêu Lưu

Game đi cảnh 2D phong cách pixel: điều khiển quả bóng đỏ lăn qua đồi cỏ, nhảy qua vực và gai, nhặt sao, rồi hạ boss ở cuối màn.

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
| Lăn trái / phải | `←` `→` hoặc `A` `D` | ◀ ▶ |
| Nhảy (giữ lâu nhảy cao hơn) | `↑`, `W` hoặc `Space` | ▲ |
| Tuyệt kĩ Vô địch | `K` hoặc `Shift` | ⚡ |
| Chơi lại | `R` | nút "Chơi lại" |

## Luật chơi

- Phải về đích trong **2 phút**; hết giờ là thua.
- Có **3 mạng**. Rơi xuống vực, chạm gai, chạm quái, chạm boss, trúng đạn hoặc laze đều mất 1 mạng. Hết mạng thì chơi lại từ đầu.
- **Cờ kiểm tra**: chạm qua thì lần ngã sau hồi sinh tại đó. Có 2 cờ, cờ thứ hai nằm ngay trước đấu trường boss.
- **Quái vuông đen**: nhảy giẫm lên đầu để hạ, chạm ngang thì mất mạng.
- **12 ngôi sao** rải khắp màn chơi.
- **Thanh chặng đường** phía trên màn hình cho biết bạn đã đi được bao xa.

### Tuyệt kĩ Vô địch

Bật trong 2 giây, hồi chiêu 10 giây. Trong lúc vô địch, bóng không bị gai và lửa làm hại, chạm quái là quái vỡ. Rơi xuống vực vẫn mất mạng.

### Boss: Lilith & Naamah

Vào đấu trường thì cổng đóng lại. Mỗi lần chỉ có một ác quỷ. Phải **giẫm lên đầu** để gây sát thương; chạm phía trước hay phía sau đều mất mạng.

| Giai đoạn | Ác quỷ | Tốc độ | Tấn công | Số lần giẫm |
|---|---|---|---|---|
| 1 | Lilith (băng) | Chậm | Không | 3 |
| 2 (Hell mode) | Lilith (băng) | Chậm | Mỗi 5 giây: vòng tinh thể băng + 3 mũi băng; phong ấn mỗi 5 giây | 3 |
| 3 (Hell mode) | Naamah (lửa) | Nhanh hơn | Mỗi 3 giây: vòng lửa + 4 cầu lửa; phong ấn mỗi 5 giây | 3 |

Vòng ma lực quanh ác quỷ đang tấn công chạm vào là mất mạng, và lúc đó không giẫm được. Đạn bay thẳng về phía trước: nhảy qua để tránh.

**Hell mode**: cứ 5 giây ác quỷ phong ấn bạn trong 3,5 giây. Bóng bị đóng băng, nhấn `Shift` (hoặc `K`, nút ⚡) để thoát. 1 giây trước khi phong ấn kết thúc, ác quỷ bắn laze sát mặt đất về phía bạn. Laze chỉ né được bằng cách nhảy lên (Vô địch không chặn được).

**Khi hạ được Lilith**: Lilith nứt ra, Naamah chui ra từ xác Lilith, biến mất rồi hiện ngay sau lưng quả bóng và đánh úp. Bóng bị giữ yên trong lúc này. Cách duy nhất để không mất mạng là bật **Vô địch** (`Shift`) trước khi bị cào; nếu Vô địch đang hồi chiêu thì chắc chắn mất 1 mạng. Hãy giữ sẵn Vô địch khi sắp hạ Lilith!

## Ghi chú về nhân vật

Hai boss là fan art dạng chibi của Lilith và Naamah, được vẽ hoàn toàn bằng code (hình khối trên canvas), không dùng hình ảnh gốc nào. Các nhân vật và *Black Clover* thuộc bản quyền của tác giả Yūki Tabata và các bên giữ bản quyền. Đây là dự án cá nhân, phi thương mại.

## Cấu trúc thư mục

```
index.html     Trang game, HUD và các bảng thông báo
css/style.css  Giao diện HUD, thanh chặng đường, thanh máu boss, nút cảm ứng
js/game.js     Màn chơi, vật lý, boss, vẽ hình và vòng lặp game
```
