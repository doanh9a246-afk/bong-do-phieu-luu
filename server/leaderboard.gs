/**
 * Bảng xếp hạng cho Bóng Đỏ Phiêu Lưu.
 *
 * Cách cài (làm một lần):
 *  1. Tạo Google Sheet mới (sheets.new), đặt tên tuỳ ý.
 *  2. Tiện ích mở rộng → Apps Script, xoá mã mẫu, dán toàn bộ tệp này, bấm Lưu.
 *  3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web
 *     - Thực thi với tư cách: Tôi
 *     - Người có quyền truy cập: Bất kỳ ai
 *     Bấm Triển khai, cấp quyền, rồi sao chép "URL ứng dụng web".
 *  4. Dán URL đó vào hằng LEADERBOARD_URL trong js/game.js.
 *
 * Xếp hạng: nhiều boss hơn > đi xa hơn > nhanh hơn. Mỗi tên chỉ giữ thành tích tốt nhất.
 */
const SHEET_NAME = 'Diem';
const TIME_LIMIT = 300;

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Thời điểm', 'Tên', 'Boss', 'Giây', 'Chặng %', 'Sao']);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function num_(v, lo, hi) {
  const n = Math.round(Number(v) || 0);
  return Math.max(lo, Math.min(hi, n));
}

function cmp_(a, b) {
  return b.bosses - a.bosses || b.progress - a.progress || a.seconds - b.seconds;
}

function doGet(e) {
  const top = num_(e && e.parameter && e.parameter.top, 1, 50) || 10;
  const values = sheet_().getDataRange().getValues().slice(1);
  const best = {};
  values.forEach(function (r) {
    const row = { name: String(r[1]).replace(/^'/, ''), bosses: Number(r[2]), seconds: Number(r[3]), progress: Number(r[4]), stars: Number(r[5]) };
    const key = row.name.toLowerCase();
    if (!best[key] || cmp_(row, best[key]) < 0) best[key] = row;
  });
  const rows = Object.keys(best).map(function (k) { return best[k]; }).sort(cmp_).slice(0, top);
  return json_({ rows: rows });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  let name = String(d.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Ẩn danh';
  if (/^[=+\-@]/.test(name)) name = "'" + name;   // chặn công thức bảng tính
  const row = [new Date(), name, num_(d.bosses, 0, 3), num_(d.seconds, 0, TIME_LIMIT), num_(d.progress, 0, 100), num_(d.stars, 0, 12)];
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { sheet_().appendRow(row); } finally { lock.releaseLock(); }
  return json_({ ok: true });
}
