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
- Có **3 mạng**. Rơi xuống vực, chạm gai, chạm quái hoặc trúng lửa boss đều mất 1 mạng. Hết mạng thì chơi lại từ đầu.
- **Cờ kiểm tra**: chạm qua thì lần ngã sau hồi sinh tại đó. Có 2 cờ, cờ thứ hai nằm ngay trước đấu trường boss.
- **Quái vuông đen**: nhảy giẫm lên đầu để hạ, chạm ngang thì mất mạng.
- **12 ngôi sao** rải khắp màn chơi.
- **Thanh chặng đường** phía trên màn hình cho biết bạn đã đi được bao xa.

### Tuyệt kĩ Vô địch

Bật trong 2 giây, hồi chiêu 30 giây. Trong lúc vô địch, bóng không bị gai và lửa làm hại, chạm quái là quái vỡ. Rơi xuống vực vẫn mất mạng.

### Boss: chibi Kurumi

Vào đấu trường thì cổng đóng lại. Boss có 3 giai đoạn, mỗi giai đoạn phải **giẫm lên đầu 3 lần**. Chạm phía trước hay phía sau boss đều mất mạng.

| Giai đoạn | Tốc độ | Tấn công |
|---|---|---|
| 1 | Chậm | Không |
| 2 (Hell mode) | Chậm | Mỗi 5 giây: đồng hồ + 3 viên đạn; ngưng đọng thời gian mỗi 5 giây |
| 3 (Hell mode) | Nhanh hơn | Mỗi 3 giây: đồng hồ + 4 viên đạn nhanh hơn; ngưng đọng thời gian mỗi 5 giây |

Khi tấn công, Kurumi triệu hồi một chiếc đồng hồ lớn quanh người (chạm vào là mất mạng, và lúc đó không giẫm được) rồi bắn đạn thẳng về phía trước: nhảy qua để tránh.

**Hell mode** bắt đầu sau 3 lần giẫm đầu tiên. Cứ 5 giây Kurumi ngưng đọng thời gian trong 3,5 giây: bóng bị đóng băng, nhấn `Shift` (hoặc `K`, nút ⚡) để thoát. 1 giây trước khi ngưng đọng kết thúc, Kurumi bắn một luồng laze khổng lồ sát mặt đất về phía bạn. Laze chỉ né được bằng cách nhảy lên (Vô địch không chặn được); hãy nhảy khi quả cầu năng lượng ở nòng súng đang to dần.

## Ghi chú về nhân vật

Boss là fan art dạng chibi của Tokisaki Kurumi, được vẽ hoàn toàn bằng code (hình khối trên canvas), không dùng hình ảnh gốc nào. Nhân vật Tokisaki Kurumi và *Date A Live* thuộc bản quyền của tác giả Koushi Tachibana và các bên giữ bản quyền. Đây là dự án cá nhân, phi thương mại.

## Cấu trúc thư mục

```
index.html     Trang game, HUD và các bảng thông báo
css/style.css  Giao diện HUD, thanh chặng đường, thanh máu boss, nút cảm ứng
js/game.js     Màn chơi, vật lý, boss, vẽ hình và vòng lặp game
```
