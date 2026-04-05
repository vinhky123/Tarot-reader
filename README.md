# Mystic Tarot

Ứng dụng web trải bài Tarot bộ **Rider–Waite** (hình ảnh công cộng), xáo bài và lật bài trên giao diện tối, kèm **lời giải tiếng Việt** từ [Google Gemini](https://ai.google.dev/) và **chat hỏi thêm** sau khi đã có kết quả.

**English:** A Vite + React app for Rider–Waite tarot spreads with Vietnamese interpretations via the Gemini API and optional follow-up chat in the same reading context. Clone, `npm install`, copy `.env.example` → `.env`, set `VITE_GEMINI_API_KEY`, then `npm run dev`.

---

## Tính năng

- **Chọn kiểu trải bài** — 1 lá, 3 lá, 5 lá, Celtic Cross (định nghĩa trong `src/data/spreads.ts`).
- **Câu hỏi / bối cảnh tùy chọn** — đưa vào prompt gửi model để lời giải sát hơn.
- **Xáo & rút ngẫu nhiên** — mỗi lần chơi là một bộ lá khác nhau; hỗ trợ lá ngược.
- **Lời giải Markdown** — hiển thị có định dạng (tiêu đề, danh sách…) qua `react-markdown` + GFM.
- **Hỏi thêm reader** — sau khi có lời giải, chat tiếp trong cùng ngữ cảnh trải bài (đoạn hội thoại gửi kèm mỗi lần gọi API).
- **Xử lý hạn mức** — thông báo rõ khi Gemini trả 429 / hết quota; gợi ý đổi model hoặc đợi.

---

## Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| UI | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Hiệu ứng | Framer Motion, tsParticles |
| AI | `@google/genai` (Gemini) |
| Nội dung | `react-markdown`, `remark-gfm` |

---

## Yêu cầu

- [Node.js](https://nodejs.org/) 20+ (khuyến nghị LTS)
- Tài khoản Google AI và [API key](https://aistudio.google.com/apikey)

---

## Cài đặt nhanh

```bash
git clone <url-repo-của-bạn> tarot-reader
cd tarot-reader
npm install
```

Sao chép file môi trường và điền API key:

```bash
cp .env.example .env
# Chỉnh .env: VITE_GEMINI_API_KEY=...
```

Chạy bản phát triển:

```bash
npm run dev
```

Build bản production:

```bash
npm run build
npm run preview   # xem thử thư mục dist/
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `VITE_GEMINI_API_KEY` | Có | API key từ Google AI Studio. |
| `VITE_GEMINI_MODEL` | Không | Mặc định `gemini-2.0-flash`. Nếu hết quota free tier, thử `gemini-2.5-flash` hoặc `gemini-1.5-flash`. |

Chi tiết cú pháp xem [`.env.example`](./.env.example).

**Lưu ý bảo mật:** tiền tố `VITE_` khiến giá trị được đưa vào bundle phía client. Repo công khai không nên commit file `.env`. Với bản triển khai thật, cân nhắc proxy API phía server thay vì lộ key trên trình duyệt.

---

## Scripts npm

| Lệnh | Mục đích |
|------|----------|
| `npm run dev` | Dev server + HMR |
| `npm run build` | `tsc` + bundle Vite → `dist/` |
| `npm run preview` | Phục vụ `dist/` cục bộ |
| `npm run lint` | ESLint |
| `npm run download-cards` | Tải ảnh lá từ Wikimedia Commons vào `public/cards/` (xem mục dưới) |

---

## Ảnh lá bài (Rider–Waite)

Ảnh trong `public/cards/` (0–77) có thể lấy bằng script:

```bash
npm run download-cards
```

Nguồn: [Wikimedia Commons](https://commons.wikimedia.org/) — Rider–Waite 1909, phạm vi công cộng. Script và manifest nằm trong [`scripts/download-cards.mjs`](./scripts/download-cards.mjs) và [`src/data/wikimedia-rws-files.json`](./src/data/wikimedia-rws-files.json).

---

## Cấu trúc mã (tóm tắt)

```
src/
  App.tsx              # Layout chính, luồng bước trải bài
  components/          # Bàn bài, kết quả, chat reader, markdown dùng chung
  hooks/useReading.ts  # State: spread, bài rút, lời giải, thread chat
  services/gemini.ts   # Gemini: đọc bài, tiếp tục hội thoại, retry 429
  data/                # spreads, tarotCards, manifest Wikimedia
```

---

## Hạn mức & lỗi thường gặp

- **429 / RESOURCE_EXHAUSTED / quota:** đợi theo gợi ý trong thông báo, đổi `VITE_GEMINI_MODEL`, hoặc xem [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) và usage trên AI Studio.
- **Thiếu API key:** ứng dụng báo lỗi rõ khi gọi Gemini mà chưa cấu hình `VITE_GEMINI_API_KEY`.

---

## Miễn trừ

Trải bài và lời giải mang tính **biểu tượng và giải trí**; không thay cho tư vấn y khoa, pháp lý hay tài chính chuyên môn. Người dùng tự chịu trách nhiệm với quyết định của mình.

---

## Giấy phép & đóng góp

Mã nguồn dự án: thêm file `LICENSE` nếu bạn muốn công bố rõ điều khoản sử dụng. Đóng góp qua issue / pull request theo quy ước của repo.

Ảnh Rider–Waite từ Wikimedia tuân theo giấy phép từng tệp trên Commons; không gộp vào “license của repo” trừ khi bạn tự xác minh.
